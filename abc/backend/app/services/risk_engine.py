from typing import Dict, Any, List, Tuple

def compute_risk(
    rule_result: Dict[str, Any],
    url_result: Dict[str, Any],
    ml_result: Dict[str, Any],
    llm_result: Dict[str, Any]
) -> Tuple[int, str, List[Dict[str, Any]], Dict[str, Any]]:
    """
    Synthesizes the four independent detection signals into a final 0-100 risk score and risk band.
    """
    total_score = 0
    all_indicators: List[Dict[str, Any]] = []

    # 1. Rule Engine contribution
    rule_score = rule_result.get("rule_score", 0)
    total_score += rule_score
    all_indicators.extend(rule_result.get("indicators", []))

    # 2. URL Analyzer contribution
    url_score = url_result.get("url_score", 0)
    total_score += url_score
    all_indicators.extend(url_result.get("indicators", []))

    # 3. ML Classifier contribution (+25 max or -10 dampener)
    ml_delta = ml_result.get("score_delta", 0)
    if ml_delta > 0:
        total_score += ml_delta
    elif ml_delta < 0:
        # Dampener applies only if existing score is not already overwhelming (>60)
        if total_score < 60:
            total_score = max(0, total_score + ml_delta)
    if ml_result.get("indicator"):
        all_indicators.append(ml_result["indicator"])

    # 4. LLM contribution (if used)
    llm_delta = llm_result.get("score_delta", 0)
    total_score += llm_delta
    if llm_result.get("indicator"):
        all_indicators.append(llm_result["indicator"])

    # Clamp total score between 0 and 100
    final_score = max(0, min(100, total_score))

    # Determine Risk Band
    if final_score >= 61:
        risk_level = "HIGH RISK"
    elif final_score >= 31:
        risk_level = "SUSPICIOUS"
    else:
        risk_level = "LOW"

    # Compile 4-signal technical breakdown
    signal_breakdown = {
        "rule_engine": {
            "signal_name": "Rule Engine",
            "fired": rule_result.get("fired", False),
            "score_impact": rule_score,
            "confidence": 0.90 if rule_result.get("fired") else 0.10,
            "summary": f"{len(rule_result.get('indicators', []))} heuristic patterns triggered (urgency, threat, coercion, or credential demands).",
            "technical_details": rule_result.get("details", {})
        },
        "url_analyzer": {
            "signal_name": "URL & Domain Analyzer",
            "fired": url_result.get("fired", False),
            "score_impact": url_score,
            "confidence": 0.95 if url_result.get("fired") else 0.10,
            "summary": f"{len(url_result.get('indicators', []))} URL deception anomalies identified (domain mismatch, suspicious TLD, or obfuscation).",
            "technical_details": {"analyzed_urls": url_result.get("details", [])}
        },
        "ml_classifier": {
            "signal_name": "ML Statistical Classifier",
            "fired": ml_result.get("fired", False),
            "score_impact": ml_delta,
            "confidence": ml_result.get("probability", 0.0),
            "summary": f"Trained linear SVM model evaluated spam probability at {ml_result.get('probability', 0.0)*100:.1f}%.",
            "technical_details": {
                "model_version": ml_result.get("model_version"),
                "predicted_label": ml_result.get("label"),
                "probability": ml_result.get("probability")
            }
        },
        "llm_layer": {
            "signal_name": "Semantic Intelligence Layer",
            "fired": llm_result.get("used", False) and llm_delta > 0,
            "score_impact": llm_delta,
            "confidence": llm_result.get("confidence", 0.0),
            "summary": llm_result.get("summary", ""),
            "technical_details": {
                "provider": llm_result.get("provider"),
                "details": llm_result.get("details", {})
            }
        }
    }

    return final_score, risk_level, all_indicators, signal_breakdown
