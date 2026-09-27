import re
from typing import List, Dict, Any, Tuple

# URL Regex finding full URLs and naked domains
URL_PATTERN = re.compile(
    r'(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*|'
    r'\b[a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|in|org|net|xyz|top|info|co|biz|online|site|app|me|tk|ml|ga|cf|gq|club|icu|vip|gov\.in|nic\.in|co\.in)(?:\/[^\s]*)?',
    re.IGNORECASE
)

# Phone Regex (India focus + international)
PHONE_PATTERN = re.compile(
    r'(?:\+91[\s\-]?)?[6-9]\d{9}\b|(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}\b|1800[\s\-]?\d{3}[\s\-]?\d{3,4}',
    re.IGNORECASE
)

# Currency / Money Regex
MONEY_PATTERN = re.compile(
    r'(?:Rs\.?|INR|₹|\$|USD)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+(?:\.\d{1,2})?\s*(?:rupees|lakh|crore|bucks)\b',
    re.IGNORECASE
)

# OTP / Sensitive Credential Pattern
OTP_PATTERN = re.compile(
    r'\b(?:otp|code|pin|password|secret|one time password)\s*(?:is|:|\-)?\s*([0-9]{4,8})\b',
    re.IGNORECASE
)

# Long Card / Account Number Pattern
ACCOUNT_PATTERN = re.compile(
    r'\b(?:\d{4}[\s\-]?){3}\d{4}\b|\b\d{11,16}\b'
)

def extract_entities(text: str) -> Dict[str, Any]:
    if not text:
        return {
            "urls": [],
            "phone_numbers": [],
            "money_mentions": [],
            "has_otp_format": False
        }

    urls = list(dict.fromkeys(URL_PATTERN.findall(text)))
    # Clean trailing punctuation from URLs
    cleaned_urls = []
    for u in urls:
        u_clean = u.rstrip(".,;:!?)'\"")
        if u_clean and u_clean not in cleaned_urls:
            cleaned_urls.append(u_clean)

    phones = list(dict.fromkeys(PHONE_PATTERN.findall(text)))
    money = list(dict.fromkeys(MONEY_PATTERN.findall(text)))
    has_otp = bool(OTP_PATTERN.search(text))

    return {
        "urls": cleaned_urls,
        "phone_numbers": phones,
        "money_mentions": money,
        "has_otp_format": has_otp
    }

def sanitize_for_privacy(text: str) -> str:
    """
    Redacts sensitive OTPs and long card/account numbers for citizen-safe display/logging,
    adhering to DPDPA privacy data minimization principles.
    """
    if not text:
        return ""
    
    # Redact OTP numbers
    def redact_otp(match):
        full = match.group(0)
        digits = match.group(1)
        return full.replace(digits, "******")

    sanitized = OTP_PATTERN.sub(redact_otp, text)
    
    # Redact long 12-16 digit numbers keeping only last 4 digits
    def redact_account(match):
        val = match.group(0).replace(" ", "").replace("-", "")
        if len(val) >= 12:
            return "X" * (len(val) - 4) + val[-4:]
        return match.group(0)

    sanitized = ACCOUNT_PATTERN.sub(redact_account, sanitized)
    return sanitized
