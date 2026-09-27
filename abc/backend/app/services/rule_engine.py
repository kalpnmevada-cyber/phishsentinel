import re
from typing import List, Dict, Any, Tuple

# Known Brand/Entity Dictionaries and their official domains for correlation
KNOWN_BRANDS = {
    "sbi": {"name": "State Bank of India", "official_domains": ["sbi.co.in", "onlinesbi.sbi", "statebankofindia.com"]},
    "yono": {"name": "SBI YONO", "official_domains": ["sbi.co.in", "onlinesbi.sbi"]},
    "hdfc": {"name": "HDFC Bank", "official_domains": ["hdfcbank.com", "hdfc.com"]},
    "icici": {"name": "ICICI Bank", "official_domains": ["icicibank.com"]},
    "axis": {"name": "Axis Bank", "official_domains": ["axisbank.com"]},
    "pnb": {"name": "Punjab National Bank", "official_domains": ["pnbindia.in"]},
    "bob": {"name": "Bank of Baroda", "official_domains": ["bankofbaroda.in"]},
    "kotak": {"name": "Kotak Mahindra Bank", "official_domains": ["kotak.com"]},
    "paytm": {"name": "Paytm", "official_domains": ["paytm.com"]},
    "phonepe": {"name": "PhonePe", "official_domains": ["phonepe.com"]},
    "gpay": {"name": "Google Pay", "official_domains": ["google.com", "pay.google.com"]},
    "income tax": {"name": "Income Tax Department", "official_domains": ["incometax.gov.in", "incometaxindiaefiling.gov.in"]},
    "it department": {"name": "Income Tax Department", "official_domains": ["incometax.gov.in"]},
    "electricity": {"name": "Electricity Board / DISCOM", "official_domains": []},
    "bsnl": {"name": "BSNL", "official_domains": ["bsnl.co.in"]},
    "jio": {"name": "Reliance Jio", "official_domains": ["jio.com"]},
    "airtel": {"name": "Airtel", "official_domains": ["airtel.in"]},
    "epfo": {"name": "EPFO", "official_domains": ["epfindia.gov.in"]},
    "uidai": {"name": "UIDAI / Aadhaar", "official_domains": ["uidai.gov.in"]},
    "aadhaar": {"name": "UIDAI / Aadhaar", "official_domains": ["uidai.gov.in"]},
    "india post": {"name": "India Post", "official_domains": ["indiapost.gov.in"]}
}

URGENCY_KEYWORDS = [
    r"\bimmediat(?:e|ely)\b",
    r"\bwithin\s*(?:24|12|48|2|3)\s*hours?\b",
    r"\btoday\s*itself\b",
    r"\btonight\s*(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:pm|am)?\b",
    r"\burgent(?:ly)?\b",
    r"\baction\s*required\b",
    r"\blast\s*chance\b",
    r"\bdeadline\b",
    r"\bexpire(?:s|d|ing)?\s*today\b",
    r"\bwithout\s*delay\b"
]

THREAT_KEYWORDS = [
    r"\baccount\s*(?:will\s*be\s*)?(?:block(?:ed)?|suspend(?:ed)?|deactivat(?:ed)?|freez(?:e|ed|ing))\b",
    r"\bpower\s*supply\s*(?:will\s*be\s*)?disconnect(?:ed)?\b",
    r"\belectricity\s*(?:will\s*be\s*)?cut\s*off\b",
    r"\blegal\s*action\b",
    r"\bpolice\s*complaint\b",
    r"\barrest\s*warrant\b",
    r"\bpenalty\s*of\s*(?:rs\.?|inr|₹)?\b",
    r"\bfine\s*will\s*be\s*imposed\b",
    r"\bsim\s*(?:card\s*)?deactivat(?:ed)?\b"
]

ACTION_REQUEST_KEYWORDS = [
    r"\bupdate\s*(?:your\s*)?(?:kyc|pan|aadhaar|profile|details)\b",
    r"\bverify\s*(?:your\s*)?(?:account|identity|bank|pan|card)\b",
    r"\bclick\s*(?:here|on|the\s*link|link\s*below)\b",
    r"\bdownload\s*(?:the\s*)?(?:app|apk|file|attachment)\b",
    r"\bcall\s*(?:our\s*)?(?:officer|manager|helpline|support|number)\b",
    r"\bshare\s*(?:your\s*)?(?:otp|pin|password|cvv)\b",
    r"\bfailure\s*to\s*(?:update|verify|comply)\b"
]

REWARD_KEYWORDS = [
    r"\b(?:won|win|winner|congratulations)\b.*?\b(?:lottery|prize|reward|cash|crore|lakh)\b",
    r"\bincome\s*tax\s*refund\s*(?:of\s*(?:rs\.?|inr|₹)?)?\s*[\d,]+\s*(?:approved|credited)\b",
    r"\bpre-approved\s*loan\s*of\b",
    r"\binstant\s*loan\s*without\s*(?:cibil|documents)\b",
    r"\bpart[\-\s]time\s*job\b.*?\b(?:earn\s*(?:daily|per\s*day))\b",
    r"\bcashback\s*of\s*(?:rs\.?|inr|₹)\s*[\d,]+\s*credited\b"
]

def analyze_rules(text: str, extracted_entities: Dict[str, Any]) -> Dict[str, Any]:
    text_lower = text.lower()
    indicators: List[Dict[str, Any]] = []
    rule_score = 0
    brand_detected = "None"
    matched_categories = set()

    # 1. Detect Brand Impersonation
    for key, info in KNOWN_BRANDS.items():
        if re.search(r"\b" + re.escape(key) + r"\b", text_lower):
            brand_detected = info["name"]
            break

    # 2. Check Urgency
    urgency_hits = []
    for pat in URGENCY_KEYWORDS:
        matches = re.findall(pat, text_lower)
        if matches:
            urgency_hits.extend(matches)
    if urgency_hits:
        rule_score += 15
        indicators.append({
            "id": "RULE_URGENCY",
            "signal_source": "rule_engine",
            "category": "Artificial Urgency",
            "severity": "HIGH",
            "title": "Artificial Urgency Detected",
            "description": f"Message creates artificial time pressure ({', '.join(urgency_hits[:2])}) to force hasty decisions.",
            "score_delta": 15
        })

    # 3. Check Threats / Coercion
    threat_hits = []
    for pat in THREAT_KEYWORDS:
        matches = re.findall(pat, text_lower)
        if matches:
            threat_hits.extend(matches)
    if threat_hits:
        rule_score += 25
        matched_categories.add("Account / Service Threat")
        indicators.append({
            "id": "RULE_THREAT",
            "signal_source": "rule_engine",
            "category": "Service Threat & Coercion",
            "severity": "HIGH",
            "title": "Service Disconnection or Block Threat",
            "description": "Message threatens immediate account freezing, electricity disconnection, or legal penalties.",
            "score_delta": 25
        })

    # 4. Check Action / Credential Demands
    action_hits = []
    for pat in ACTION_REQUEST_KEYWORDS:
        matches = re.findall(pat, text_lower)
        if matches:
            action_hits.extend(matches)
    if action_hits:
        rule_score += 20
        matched_categories.add("Credential / KYC Request")
        indicators.append({
            "id": "RULE_CREDENTIAL_ACTION",
            "signal_source": "rule_engine",
            "category": "Credential Harvesting",
            "severity": "CRITICAL" if any("otp" in h or "pin" in h or "password" in h for h in action_hits) else "HIGH",
            "title": "Demands Sensitive Action (KYC/Link/Credentials)",
            "description": "Message directs recipient to update PAN/KYC or download unverified apps/files.",
            "score_delta": 20
        })

    # 5. Check Lottery / Fake Refund / Job Rewards
    reward_hits = []
    for pat in REWARD_KEYWORDS:
        matches = re.findall(pat, text_lower)
        if matches:
            reward_hits.extend(matches)
    if reward_hits:
        rule_score += 25
        matched_categories.add("Lure & Fake Reward")
        indicators.append({
            "id": "RULE_LURE_REWARD",
            "signal_source": "rule_engine",
            "category": "Unsolicited Financial Lure",
            "severity": "HIGH",
            "title": "Unsolicited Lottery / Refund / Job Lure",
            "description": "Message promises unverified refunds, prizes, or instant loans to entice user action.",
            "score_delta": 25
        })

    # 6. APK Download Mention Check
    if re.search(r"\b(?:\.apk|download\s*apk|install\s*app|support\.apk)\b", text_lower):
        rule_score += 30
        indicators.append({
            "id": "RULE_MALICIOUS_APK",
            "signal_source": "rule_engine",
            "category": "Malware / Malicious App",
            "severity": "CRITICAL",
            "title": "Direct APK / App Installation Solicited",
            "description": "Message prompts downloading an Android package (.apk) outside official app stores, a major trojan vector.",
            "score_delta": 30
        })

    # Assign broad classification category
    if "electricity" in text_lower or "bijli" in text_lower or "power supply" in text_lower:
        category = "Electricity Bill Scam"
    elif "income tax" in text_lower or "refund" in text_lower and ("tax" in text_lower or "it dept" in text_lower):
        category = "Income Tax Refund Scam"
    elif brand_detected != "None" or "kyc" in text_lower or "pan card" in text_lower or "yono" in text_lower:
        category = "Bank / KYC Impersonation"
    elif reward_hits:
        category = "Lottery / Prize / Job Scam"
    elif threat_hits or action_hits:
        category = "Generic Phishing / Coercion"
    else:
        category = "Legitimate / Personal"

    return {
        "rule_score": min(rule_score, 100),
        "brand_claimed": brand_detected,
        "category": category,
        "indicators": indicators,
        "fired": len(indicators) > 0,
        "details": {
            "urgency_matches": urgency_hits,
            "threat_matches": threat_hits,
            "action_matches": action_hits,
            "reward_matches": reward_hits
        }
    }
