import re
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional

SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".club", ".icu",
    ".vip", ".work", ".click", ".buzz", ".fit", ".rest", ".live", ".cam",
    ".info", ".cc", ".to", ".su"
}

URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "is.gd", "t.co", "cutt.ly", "rb.gy",
    "shorturl.at", "ow.ly", "buff.ly", "goo.gl", "rebrand.ly", "v.gd"
}

IP_HOST_REGEX = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")

def analyze_urls(urls: List[str], brand_claimed: str) -> Dict[str, Any]:
    indicators = []
    url_score = 0
    analyzed_details = []

    for raw_url in urls:
        # String parsing strictly without outbound network requests (SSRF immunity)
        url_to_parse = raw_url if "://" in raw_url else f"http://{raw_url}"
        try:
            parsed = urlparse(url_to_parse)
            netloc = parsed.netloc.lower()
            if ":" in netloc:
                netloc = netloc.split(":")[0]
            path = parsed.path.lower()
        except Exception:
            continue

        item_details = {
            "raw_url": raw_url,
            "domain": netloc,
            "path": path,
            "flags": []
        }

        # 1. IP Address used as Hostname
        if IP_HOST_REGEX.match(netloc):
            url_score += 35
            item_details["flags"].append("ip_as_hostname")
            indicators.append({
                "id": "URL_IP_HOST",
                "signal_source": "url_analyzer",
                "category": "Suspicious URL Structure",
                "severity": "CRITICAL",
                "title": "Raw IP Address in Link",
                "description": f"URL uses a raw IP address ({netloc}) instead of a trusted domain name.",
                "score_delta": 35
            })

        # 2. Punycode / Homoglyph Attack
        if "xn--" in netloc:
            url_score += 30
            item_details["flags"].append("punycode_homoglyph")
            indicators.append({
                "id": "URL_PUNYCODE",
                "signal_source": "url_analyzer",
                "category": "Domain Deception",
                "severity": "CRITICAL",
                "title": "Punycode / Homoglyph Domain",
                "description": f"Domain ({netloc}) uses internationalized characters to masquerade as a legitimate site.",
                "score_delta": 30
            })

        # 3. URL Shortener Concealing Destination
        if netloc in URL_SHORTENERS:
            url_score += 20
            item_details["flags"].append("url_shortener")
            indicators.append({
                "id": "URL_SHORTENER",
                "signal_source": "url_analyzer",
                "category": "Obfuscated Destination",
                "severity": "MEDIUM",
                "title": "Obfuscated Short Link",
                "description": f"Link uses a shortening service ({netloc}) to conceal the actual destination endpoint.",
                "score_delta": 20
            })

        # 4. Suspicious or Cheap TLD
        for tld in SUSPICIOUS_TLDS:
            if netloc.endswith(tld):
                url_score += 25
                item_details["flags"].append(f"suspicious_tld_{tld}")
                indicators.append({
                    "id": "URL_SUSPICIOUS_TLD",
                    "signal_source": "url_analyzer",
                    "category": "High-Risk Top-Level Domain",
                    "severity": "HIGH",
                    "title": f"High-Risk Domain Extension ({tld})",
                    "description": f"Domain ends in {tld}, frequently abused for disposable phishing campaigns.",
                    "score_delta": 25
                })
                break

        # 5. Brand Mismatch / Fake Subdomain Spoofing
        if brand_claimed and brand_claimed != "None":
            brand_token = brand_claimed.lower().replace(" ", "")
            # Check if domain contains brand name but is NOT official
            brand_keywords = {
                "State Bank of India": ["sbi", "onlinesbi", "yono"],
                "SBI YONO": ["sbi", "yono", "onlinesbi"],
                "HDFC Bank": ["hdfc"],
                "ICICI Bank": ["icici"],
                "Axis Bank": ["axis"],
                "Punjab National Bank": ["pnb"],
                "Income Tax Department": ["incometax", "itdept", "refund"],
                "UIDAI / Aadhaar": ["uidai", "aadhaar"],
                "India Post": ["indiapost", "post"]
            }
            
            official_allowed = {
                "State Bank of India": ["sbi.co.in", "onlinesbi.sbi", "statebankofindia.com"],
                "SBI YONO": ["sbi.co.in", "onlinesbi.sbi"],
                "HDFC Bank": ["hdfcbank.com", "hdfc.com"],
                "ICICI Bank": ["icicibank.com"],
                "Axis Bank": ["axisbank.com"],
                "Punjab National Bank": ["pnbindia.in"],
                "Income Tax Department": ["incometax.gov.in", "incometaxindiaefiling.gov.in"],
                "UIDAI / Aadhaar": ["uidai.gov.in"],
                "India Post": ["indiapost.gov.in"]
            }
            
            tokens = brand_keywords.get(brand_claimed, [brand_token])
            official = official_allowed.get(brand_claimed, [])
            
            # If domain contains brand token but is NOT ending in any official domain
            contains_token = any(t in netloc for t in tokens)
            is_official = any(netloc == off or netloc.endswith("." + off) for off in official)
            
            if contains_token and not is_official:
                url_score += 40
                item_details["flags"].append("brand_domain_mismatch")
                indicators.append({
                    "id": "URL_BRAND_MISMATCH",
                    "signal_source": "url_analyzer",
                    "category": "Brand Impersonation & Typosquatting",
                    "severity": "CRITICAL",
                    "title": f"Domain Mismatch: Impersonating {brand_claimed}",
                    "description": f"Domain '{netloc}' mimics {brand_claimed} but is NOT registered to an official domain ({', '.join(official) if official else 'official registry'}).",
                    "score_delta": 40
                })

        # 6. Multiple Subdomains / Hyphen Stacking
        parts = netloc.split(".")
        if len(parts) >= 4 or netloc.count("-") >= 3:
            url_score += 15
            item_details["flags"].append("excessive_subdomains_hyphens")
            indicators.append({
                "id": "URL_COMPLEX_SUBDOMAINS",
                "signal_source": "url_analyzer",
                "category": "Domain Deception",
                "severity": "MEDIUM",
                "title": "Deceptive Subdomain / Hyphen Stacking",
                "description": f"Domain structure '{netloc}' uses nested subdomains or hyphenation commonly seen in phishing kits.",
                "score_delta": 15
            })

        analyzed_details.append(item_details)

    return {
        "url_score": min(url_score, 100),
        "indicators": indicators,
        "fired": len(indicators) > 0,
        "details": analyzed_details
    }
