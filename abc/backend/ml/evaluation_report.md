# PhishGuard ML Model Evaluation Report

**Model Version:** `v2.0-tfidf-linear`  
**Architecture:** Linear SVM (Calibrated, Balanced) (TF-IDF 1-2 grams + Sublinear TF + Balanced weighting)  
**Trained At:** 2026-09-26T14:26:32.412524+00:00  
**Source Dataset:** `combined_fraud_sms_dataset.xlsx` (SHA256: `446cb27221640c40...`)  
**Data Statistics:** Total Raw: 7742 | Unique Records: 7739 (Train: 5417, Val: 1161, Test: 1161)  

---

## 1. Candidate Comparison (Validation Set)

| Candidate Model | Validation Accuracy | Spam Precision | Spam Recall | Spam F1-Score |
|---|---|---|---|---|
| **Multinomial Naive Bayes** | 97.24% | 95.10% | 92.09% | **93.57%** |
| **Logistic Regression (Balanced)** | 97.16% | 93.31% | 93.68% | **93.49%** |
| **Linear SVM (Calibrated, Balanced)** | 97.93% | 96.36% | 94.07% | **95.20%** |
| **Random Forest** | 97.16% | 96.61% | 90.12% | **93.25%** |

*Selected Best Model:* **Linear SVM (Calibrated, Balanced)** selected by highest Spam F1.

---

## 2. Overall Test Set Performance (Held-Out Test Split)

- **Overall Accuracy:** 97.85%
- **Spam Precision:** 94.53%
- **Spam Recall:** 95.65%
- **Spam F1-Score:** 95.09%
- **Ham F1-Score:** 98.62%

### Confusion Matrix (Overall Test Set)
| | Predicted Ham (0) | Predicted Spam (1) |
|---|---|---|
| **Actual Ham** | 894 (TN) | 14 (FP) |
| **Actual Spam** | 11 (FN) | 242 (TP) |

---

## 3. Financial Scams Detection Subset Performance (PS-Specific Line Item)

*Evaluation specifically on the bank/government impersonation corpus (`financial_scams_detection`):*

- **Subset Accuracy:** 95.95%
- **Scam Precision:** 94.72%
- **Scam Recall:** 98.71%
- **Scam F1-Score:** 96.67%
- **Total Subset Samples Evaluated:** 518

### Confusion Matrix (Financial Scams Subset)
| | Predicted Ham | Predicted Scam/Spam |
|---|---|---|
| **Actual Ham** | 192 | 17 |
| **Actual Scam** | 4 | 305 |

---

## 4. Test Accuracy by Source Corpus

- **`financial_scams_detection`** (79 test samples): **87.34% accuracy**
- **`spam_ham_india`** (315 test samples): **99.37% accuracy**
- **`sms_spam_collection`** (767 test samples): **98.31% accuracy**
