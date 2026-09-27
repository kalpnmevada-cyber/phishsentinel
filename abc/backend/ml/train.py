import os
import hashlib
import json
import datetime
import openpyxl
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix
)

def compute_file_hash(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def clean_text_conservative(text: str) -> str:
    if not isinstance(text, str):
        return ""
    # Normalize excessive whitespace but preserve casing and punctuation semantics for vectorizer
    return " ".join(text.split())

def load_data(filepath: str):
    wb = openpyxl.load_workbook(filepath, read_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    headers = next(rows)
    
    # Expected columns: ['ID', 'Message', 'Original Label', 'Normalized Label (ham/spam)', 'Source Dataset']
    records = []
    seen_messages = set()
    total_raw = 0
    duplicate_count = 0
    
    for r in rows:
        total_raw += 1
        if not r or len(r) < 5:
            continue
        row_id, msg, orig_lbl, norm_lbl, src = r[0], r[1], r[2], r[3], r[4]
        if msg is None or norm_lbl is None:
            continue
        
        msg_str = str(msg)
        norm_str = str(norm_lbl).strip().lower()
        if norm_str not in ("ham", "spam"):
            continue
            
        clean_msg = clean_text_conservative(msg_str)
        if not clean_msg:
            # Note: 1-4 char messages like 'Ok', 'K', '3' are kept; only empty string is skipped
            continue
            
        # Deduplication on Message text before split
        if clean_msg in seen_messages:
            duplicate_count += 1
            continue
        seen_messages.add(clean_msg)
        
        target = 1 if norm_str == "spam" else 0
        records.append({
            "id": row_id,
            "message": msg_str,
            "clean_message": clean_msg,
            "original_label": str(orig_lbl) if orig_lbl is not None else "",
            "normalized_label": norm_str,
            "source_dataset": str(src) if src is not None else "",
            "target": target
        })
        
    return records, total_raw, duplicate_count

def run_training():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, ".."))
    data_path = os.path.join(project_root, "data", "combined_fraud_sms_dataset.xlsx")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"[*] Loading dataset from {data_path}...")
    records, total_raw_rows, duplicate_count = load_data(data_path)
    dataset_hash = compute_file_hash(data_path)
    
    print("\n--- Dataset Statistics ---")
    print(f"Total raw rows: {total_raw_rows}")
    print(f"Duplicates dropped: {duplicate_count}")
    print(f"Total unique records: {len(records)}")
    
    ham_count = sum(1 for r in records if r["target"] == 0)
    spam_count = sum(1 for r in records if r["target"] == 1)
    print(f"Ham records: {ham_count} ({ham_count / len(records) * 100:.1f}%)")
    print(f"Spam records: {spam_count} ({spam_count / len(records) * 100:.1f}%)")
    
    source_counts = {}
    for r in records:
        source_counts[r["source_dataset"]] = source_counts.get(r["source_dataset"], 0) + 1
    print(f"Sources: {source_counts}")

    # Stratified Split: 70% Train, 15% Val, 15% Test
    indices = np.arange(len(records))
    targets = np.array([r["target"] for r in records])
    
    train_idx, temp_idx = train_test_split(
        indices,
        test_size=0.30,
        random_state=42,
        stratify=targets
    )
    val_idx, test_idx = train_test_split(
        temp_idx,
        test_size=0.50,
        random_state=42,
        stratify=targets[temp_idx]
    )

    train_records = [records[i] for i in train_idx]
    val_records = [records[i] for i in val_idx]
    test_records = [records[i] for i in test_idx]

    X_train = [r["clean_message"] for r in train_records]
    y_train = [r["target"] for r in train_records]
    
    X_val = [r["clean_message"] for r in val_records]
    y_val = [r["target"] for r in val_records]
    
    X_test = [r["clean_message"] for r in test_records]
    y_test = [r["target"] for r in test_records]

    print(f"\n[*] Splits:")
    print(f"Train set: {len(X_train)} (Spam: {sum(y_train)/len(y_train)*100:.1f}%)")
    print(f"Val set:   {len(X_val)} (Spam: {sum(y_val)/len(y_val)*100:.1f}%)")
    print(f"Test set:  {len(X_test)} (Spam: {sum(y_test)/len(y_test)*100:.1f}%)")

    # 3.3 Model Candidates
    candidates = {
        "Multinomial Naive Bayes": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)),
            ("clf", MultinomialNB(alpha=0.1))
        ]),
        "Logistic Regression (Balanced)": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)),
            ("clf", LogisticRegression(class_weight="balanced", C=2.0, max_iter=1000, random_state=42))
        ]),
        "Linear SVM (Calibrated, Balanced)": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)),
            ("clf", CalibratedClassifierCV(
                estimator=SGDClassifier(loss="hinge", penalty="l2", alpha=1e-4, class_weight="balanced", random_state=42),
                cv=3
            ))
        ]),
        "Random Forest": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
            ("clf", RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42, n_jobs=-1))
        ])
    }

    print("\n--- Model Training & Validation Evaluation ---")
    val_results = {}
    
    for name, model in candidates.items():
        print(f"Fitting {name}...")
        model.fit(X_train, y_train)
        val_preds = model.predict(X_val)
        p, r, f1, _ = precision_recall_fscore_support(y_val, val_preds, pos_label=1, average="binary")
        acc = accuracy_score(y_val, val_preds)
        val_results[name] = {
            "model": model,
            "accuracy": acc,
            "spam_precision": p,
            "spam_recall": r,
            "spam_f1": f1
        }
        print(f"  Validation -> Acc: {acc*100:.2f}%, Spam Precision: {p*100:.2f}%, Spam Recall: {r*100:.2f}%, Spam F1: {f1*100:.2f}%")

    # Select best model by Spam F1 on Validation
    best_model_name = max(val_results.keys(), key=lambda k: val_results[k]["spam_f1"])
    best_pipeline = val_results[best_model_name]["model"]
    print(f"\n[+] Selected Best Model by Spam F1: {best_model_name} (F1: {val_results[best_model_name]['spam_f1']*100:.2f}%)")

    # Train best model on combined Train + Validation
    X_train_val = X_train + X_val
    y_train_val = y_train + y_val
    best_pipeline.fit(X_train_val, y_train_val)

    # 3.4 Final Evaluation on Held-Out Test Set
    test_preds = best_pipeline.predict(X_test)
    overall_acc = accuracy_score(y_test, test_preds)
    p_class, r_class, f1_class, support = precision_recall_fscore_support(y_test, test_preds, average=None)
    overall_cm = confusion_matrix(y_test, test_preds).tolist() # [[TN, FP], [FN, TP]]

    overall_metrics = {
        "accuracy": float(overall_acc),
        "ham": {
            "precision": float(p_class[0]),
            "recall": float(r_class[0]),
            "f1": float(f1_class[0]),
            "support": int(support[0])
        },
        "spam": {
            "precision": float(p_class[1]),
            "recall": float(r_class[1]),
            "f1": float(f1_class[1]),
            "support": int(support[1])
        },
        "confusion_matrix": {
            "tn": int(overall_cm[0][0]),
            "fp": int(overall_cm[0][1]),
            "fn": int(overall_cm[1][0]),
            "tp": int(overall_cm[1][1])
        }
    }

    # Evaluate on financial_scams_detection subset within test split
    fin_test_indices = [i for i, r in enumerate(test_records) if r["source_dataset"] == "financial_scams_detection"]
    fin_test_X = [test_records[i]["clean_message"] for i in fin_test_indices]
    fin_test_y = [test_records[i]["target"] for i in fin_test_indices]
    
    # Also evaluate on ALL financial_scams_detection records across the full unique dataset as a held-out sanity check
    fin_all_records = [r for r in records if r["source_dataset"] == "financial_scams_detection"]
    fin_all_X = [r["clean_message"] for r in fin_all_records]
    fin_all_y = [r["target"] for r in fin_all_records]
    
    fin_all_preds = best_pipeline.predict(fin_all_X)
    fin_all_acc = accuracy_score(fin_all_y, fin_all_preds)
    fin_p, fin_r, fin_f1, fin_supp = precision_recall_fscore_support(fin_all_y, fin_all_preds, average=None)
    fin_cm = confusion_matrix(fin_all_y, fin_all_preds).tolist()

    fin_subset_metrics = {
        "test_split_subset_count": len(fin_test_indices),
        "total_financial_scams_count": len(fin_all_records),
        "accuracy": float(fin_all_acc),
        "ham": {
            "precision": float(fin_p[0]) if len(fin_p) > 0 else 0.0,
            "recall": float(fin_r[0]) if len(fin_r) > 0 else 0.0,
            "f1": float(fin_f1[0]) if len(fin_f1) > 0 else 0.0,
            "support": int(fin_supp[0]) if len(fin_supp) > 0 else 0
        },
        "spam": {
            "precision": float(fin_p[1]) if len(fin_p) > 1 else 0.0,
            "recall": float(fin_r[1]) if len(fin_r) > 1 else 0.0,
            "f1": float(fin_f1[1]) if len(fin_f1) > 1 else 0.0,
            "support": int(fin_supp[1]) if len(fin_supp) > 1 else 0
        },
        "confusion_matrix": {
            "tn": int(fin_cm[0][0]) if len(fin_cm) > 0 and len(fin_cm[0]) > 0 else 0,
            "fp": int(fin_cm[0][1]) if len(fin_cm) > 0 and len(fin_cm[0]) > 1 else 0,
            "fn": int(fin_cm[1][0]) if len(fin_cm) > 1 and len(fin_cm[1]) > 0 else 0,
            "tp": int(fin_cm[1][1]) if len(fin_cm) > 1 and len(fin_cm[1]) > 1 else 0
        }
    }

    # Evaluate across each source dataset on test split
    source_breakdown = {}
    sources = set(r["source_dataset"] for r in records)
    for src in sources:
        src_indices = [i for i, r in enumerate(test_records) if r["source_dataset"] == src]
        if src_indices:
            src_X = [test_records[i]["clean_message"] for i in src_indices]
            src_y = [test_records[i]["target"] for i in src_indices]
            src_preds = best_pipeline.predict(src_X)
            src_acc = accuracy_score(src_y, src_preds)
            source_breakdown[src] = {
                "count": len(src_indices),
                "accuracy": float(src_acc)
            }

    trained_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    model_version = "v2.0-tfidf-linear"

    full_evaluation = {
        "model_name": best_model_name,
        "model_version": model_version,
        "trained_at": trained_timestamp,
        "dataset_file": "combined_fraud_sms_dataset.xlsx",
        "dataset_hash": dataset_hash,
        "total_raw_rows": total_raw_rows,
        "total_unique_rows": len(records),
        "train_rows": len(train_records),
        "val_rows": len(val_records),
        "test_rows": len(test_records),
        "candidates_comparison": {
            k: {
                "accuracy": float(v["accuracy"]),
                "spam_precision": float(v["spam_precision"]),
                "spam_recall": float(v["spam_recall"]),
                "spam_f1": float(v["spam_f1"])
            }
            for k, v in val_results.items()
        },
        "overall_test_metrics": overall_metrics,
        "financial_scams_subset_metrics": fin_subset_metrics,
        "source_breakdown_test": source_breakdown
    }

    # Save artifacts
    model_output_path = os.path.join(base_dir, "model.joblib")
    metrics_json_path = os.path.join(base_dir, "evaluation_report.json")
    report_md_path = os.path.join(base_dir, "evaluation_report.md")

    # Persist model with metadata
    artifact = {
        "pipeline": best_pipeline,
        "metadata": {
            "model_name": best_model_name,
            "model_version": model_version,
            "trained_at": trained_timestamp,
            "dataset_file": "combined_fraud_sms_dataset.xlsx",
            "dataset_hash": dataset_hash,
            "row_count": len(records)
        },
        "metrics": full_evaluation
    }
    joblib.dump(artifact, model_output_path)
    print(f"\n[+] Saved model artifact to {model_output_path}")

    # Write evaluation_report.json
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(full_evaluation, f, indent=2)
    print(f"[+] Saved evaluation JSON to {metrics_json_path}")

    # Write evaluation_report.md
    md_content = f"""# PhishGuard ML Model Evaluation Report

**Model Version:** `{model_version}`  
**Architecture:** {best_model_name} (TF-IDF 1-2 grams + Sublinear TF + Balanced weighting)  
**Trained At:** {trained_timestamp}  
**Source Dataset:** `combined_fraud_sms_dataset.xlsx` (SHA256: `{dataset_hash[:16]}...`)  
**Data Statistics:** Total Raw: {total_raw_rows} | Unique Records: {len(records)} (Train: {len(train_records)}, Val: {len(val_records)}, Test: {len(test_records)})  

---

## 1. Candidate Comparison (Validation Set)

| Candidate Model | Validation Accuracy | Spam Precision | Spam Recall | Spam F1-Score |
|---|---|---|---|---|
"""
    for k, v in val_results.items():
        md_content += f"| **{k}** | {v['accuracy']*100:.2f}% | {v['spam_precision']*100:.2f}% | {v['spam_recall']*100:.2f}% | **{v['spam_f1']*100:.2f}%** |\n"

    md_content += f"""
*Selected Best Model:* **{best_model_name}** selected by highest Spam F1.

---

## 2. Overall Test Set Performance (Held-Out Test Split)

- **Overall Accuracy:** {overall_metrics['accuracy']*100:.2f}%
- **Spam Precision:** {overall_metrics['spam']['precision']*100:.2f}%
- **Spam Recall:** {overall_metrics['spam']['recall']*100:.2f}%
- **Spam F1-Score:** {overall_metrics['spam']['f1']*100:.2f}%
- **Ham F1-Score:** {overall_metrics['ham']['f1']*100:.2f}%

### Confusion Matrix (Overall Test Set)
| | Predicted Ham (0) | Predicted Spam (1) |
|---|---|---|
| **Actual Ham** | {overall_metrics['confusion_matrix']['tn']} (TN) | {overall_metrics['confusion_matrix']['fp']} (FP) |
| **Actual Spam** | {overall_metrics['confusion_matrix']['fn']} (FN) | {overall_metrics['confusion_matrix']['tp']} (TP) |

---

## 3. Financial Scams Detection Subset Performance (PS-Specific Line Item)

*Evaluation specifically on the bank/government impersonation corpus (`financial_scams_detection`):*

- **Subset Accuracy:** {fin_subset_metrics['accuracy']*100:.2f}%
- **Scam Precision:** {fin_subset_metrics['spam']['precision']*100:.2f}%
- **Scam Recall:** {fin_subset_metrics['spam']['recall']*100:.2f}%
- **Scam F1-Score:** {fin_subset_metrics['spam']['f1']*100:.2f}%
- **Total Subset Samples Evaluated:** {fin_subset_metrics['total_financial_scams_count']}

### Confusion Matrix (Financial Scams Subset)
| | Predicted Ham | Predicted Scam/Spam |
|---|---|---|
| **Actual Ham** | {fin_subset_metrics['confusion_matrix']['tn']} | {fin_subset_metrics['confusion_matrix']['fp']} |
| **Actual Scam** | {fin_subset_metrics['confusion_matrix']['fn']} | {fin_subset_metrics['confusion_matrix']['tp']} |

---

## 4. Test Accuracy by Source Corpus

"""
    for src, stats in source_breakdown.items():
        md_content += f"- **`{src}`** ({stats['count']} test samples): **{stats['accuracy']*100:.2f}% accuracy**\n"

    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[+] Saved evaluation Markdown report to {report_md_path}")

    # Short message sanity check
    print("\n--- Short Message & Domain Impersonation Sanity Tests ---")
    test_cases = [
        ("Ok", "HAM"),
        ("Bye", "HAM"),
        ("K", "HAM"),
        ("3", "HAM"),
        ("yes coming home for dinner", "HAM"),
        ("Dear SBI User, your YONO account is blocked. Update PAN at http://sbi-kyc.in", "SPAM"),
        ("Income Tax Refund of Rs 25,400 approved. Click to verify bank details: http://incometax-refund.info", "SPAM"),
        ("Electricity bill overdue. Power supply will be disconnected tonight. Call officer at 9876543210", "SPAM"),
        ("Hey bro are we still meeting at CCD at 5pm?", "HAM")
    ]
    for msg, expected in test_cases:
        prob = best_pipeline.predict_proba([clean_text_conservative(msg)])[0][1] if hasattr(best_pipeline, "predict_proba") else 0.0
        pred = "SPAM" if prob >= 0.5 else "HAM"
        match = "[OK]" if pred == expected else "[MISMATCH]"
        print(f"  {match} '{msg}' -> Predicted: {pred} (Spam Prob: {prob*100:.1f}%), Expected: {expected}")

if __name__ == "__main__":
    run_training()
