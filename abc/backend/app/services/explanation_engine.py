from typing import List, Dict, Any

def generate_explanation(
    risk_score: int,
    risk_level: str,
    category: str,
    brand_claimed: str,
    indicators: List[Dict[str, Any]],
    signal_breakdown: Dict[str, Any]
) -> Dict[str, Any]:
    plain_reasons_en = []
    
    # Compile plain English reasons based on fired indicators
    for ind in indicators:
        if ind["id"] == "URL_BRAND_MISMATCH":
            plain_reasons_en.append(f"The web link does not belong to {brand_claimed}. It points to an unverified third-party site designed to mimic official login pages.")
        elif ind["id"] == "URL_SUSPICIOUS_TLD":
            plain_reasons_en.append("The link uses a suspicious or disposable domain extension commonly used by scam networks.")
        elif ind["id"] == "URL_SHORTENER":
            plain_reasons_en.append("The message conceals its true destination using a URL shortener link.")
        elif ind["id"] == "URL_IP_HOST":
            plain_reasons_en.append("The link points directly to a raw IP address rather than a secure institutional domain.")
        elif ind["id"] == "RULE_URGENCY":
            plain_reasons_en.append("It creates panic and artificial urgency (e.g., claiming immediate cutoff or 24-hour expiration) to prevent you from double-checking.")
        elif ind["id"] == "RULE_THREAT":
            plain_reasons_en.append("It threatens punitive actions like account freezing, electricity disconnection, or police complaints to coerce compliance.")
        elif ind["id"] == "RULE_CREDENTIAL_ACTION":
            plain_reasons_en.append("It instructs you to update KYC, click unverified links, or share personal banking credentials.")
        elif ind["id"] == "RULE_MALICIOUS_APK":
            plain_reasons_en.append("It asks you to install an unknown APK file, which can install malware or spyware on your smartphone.")
        elif ind["id"] == "RULE_LURE_REWARD":
            plain_reasons_en.append("It uses an unsolicited lottery, tax refund, or instant loan promise as bait to capture financial details.")
        elif ind["id"] == "ML_SPAM_DETECTION":
            plain_reasons_en.append("Our AI statistical classifier detected vocabulary and grammatical patterns characteristic of financial phishing messages.")

    if not plain_reasons_en:
        if risk_level == "LOW":
            plain_reasons_en.append("No obvious phishing indicators, brand spoofing, or malicious links were detected.")
            plain_reasons_en.append("The text patterns resemble authentic conversational or informational messaging.")
        else:
            plain_reasons_en.append("Multiple minor anomalies were detected across the message structure.")

    # Summary
    if risk_level == "HIGH RISK":
        summary_en = f"High probability of fraud. This message appears to be a fraudulent attempt imitating {brand_claimed if brand_claimed != 'None' else 'a trusted institution'} designed to steal credentials or money."
        recommended_action_en = "DO NOT click any links, DO NOT call numbers listed in the message, and NEVER share OTPs or passwords. Verify directly through official banking apps or call the national cybercrime helpline at 1930."
    elif risk_level == "SUSPICIOUS":
        summary_en = f"This message contains several suspicious indicators typical of unsolicited marketing or unverified requests."
        recommended_action_en = "Exercise caution. Do not share personal information or follow unknown links without verifying the sender through trusted official channels."
    else:
        summary_en = "This message shows no significant signs of fraud or phishing."
        recommended_action_en = "Normal safety precautions apply. Remember that official institutions never ask for your PIN, passwords, or OTP via SMS or chat."

    # Multilingual Translations for Hindi (hi) and Gujarati (gu)
    translations = {
        "en": {
            "summary": summary_en,
            "reasons": plain_reasons_en,
            "recommended_action": recommended_action_en,
            "category_label": category,
            "risk_label": risk_level
        },
        "hi": {
            "summary": "धोखाधड़ी की अत्यधिक संभावना। यह संदेश आपके बैंक खाते या व्यक्तिगत जानकारी को चुराने का प्रयास प्रतीत होता है।" if risk_level == "HIGH RISK" else "यह संदेश संदिग्ध लग रहा है। कृपया सावधानी बरतें।" if risk_level == "SUSPICIOUS" else "इस संदेश में धोखाधड़ी का कोई संकेत नहीं मिला है।",
            "reasons": [
                "वेबसाइट लिंक आधिकारिक संस्था का नहीं है बल्कि एक नकली पेज पर ले जाता है।" if any("URL" in ind["id"] for ind in indicators) else "संदेश में अनधिकृत लिंक शामिल है।",
                "संदेश में खाता बंद होने या बिजली कटने जैसी अनुचित जल्दबाजी और धमकी दी गई है।" if any("RULE_THREAT" in ind["id"] or "RULE_URGENCY" in ind["id"] for ind in indicators) else "संदेश में संदिग्ध दबाव बनाया गया है।",
                "केवाईसी (KYC) अपडेट या व्यक्तिगत विवरण मांगने के लिए असुरक्षित निर्देश दिए गए हैं।" if any("RULE_CREDENTIAL" in ind["id"] for ind in indicators) else "मशीन लर्निंग मॉडल ने इसे वित्तीय धोखाधड़ी के रूप में पहचाना है।"
            ],
            "recommended_action": "किसी भी लिंक पर क्लिक न करें, संदेश में दिए गए नंबर पर कॉल न करें और कभी भी ओटीपी (OTP) या पिन साझा न करें। तुरंत साइबर हेल्पलाइन 1930 पर रिपोर्ट करें।" if risk_level == "HIGH RISK" else "संदेश में दिए गए लिंक पर भरोसा न करें और संबंधित बैंक या सेवा प्रदाता की आधिकारिक वेबसाइट पर ही जाएं।",
            "category_label": "बैंक / संस्था प्रतिरूपण" if "Bank" in category or "KYC" in category else "धोखाधड़ी संदेश",
            "risk_label": "उच्च जोखिम (HIGH RISK)" if risk_level == "HIGH RISK" else "संदिग्ध (SUSPICIOUS)" if risk_level == "SUSPICIOUS" else "सुरक्षित (LOW RISK)"
        },
        "gu": {
            "summary": "છેતરપિંડીની ઉચ્ચ શક્યતા. આ સંદેશ તમારી બેંકિંગ માહિતી અથવા પૈસા ચોરી કરવા માટે મોકલવામાં આવ્યો હોવાની સંભાવના છે." if risk_level == "HIGH RISK" else "આ સંદેશ શંકાસ્પદ જણાય છે. કૃપા કરીને સાવચેતી રાખો." if risk_level == "SUSPICIOUS" else "આ સંદેશમાં છેતરપિંડીનો કોઈ મોટો સંકેત મળ્યો નથી.",
            "reasons": [
                "વેબ લિંક સત્તાવાર સંસ્થાની નથી અને નકલી વેબસાઇટ તરફ દોરી જાય છે." if any("URL" in ind["id"] for ind in indicators) else "સંદેશમાં અજાણી લિંક છે.",
                "ખાતું બ્લોક થવા અથવા કનેક્શન કાપવાની ખોટી ધમકી આપવામાં આવી છે." if any("RULE_THREAT" in ind["id"] or "RULE_URGENCY" in ind["id"] for ind in indicators) else "કટોકટી દર્શાવીને તાત્કાલિક પગલાં લેવા દબાણ કરવામાં આવ્યું છે.",
                "કેવાયસી (KYC) અપડેટ કરવા અથવા પિન/ઓટીપી આપવા માટે ગેરમાર્ગે દોરવામાં આવ્યા છે." if any("RULE_CREDENTIAL" in ind["id"] for ind in indicators) else "અમારા AI મોડેલે આને સ્કેમ પેટર્ન તરીકે ચિહ્નિત કર્યું છે."
            ],
            "recommended_action": "કોઈપણ લિંક પર ક્લિક કરશો નહીં, સંદેશમાં આપેલા નંબર પર ફોન કરશો નહીં અને ક્યારેય OTP કે PIN શેર કરશો નહીં. સાયબર હેલ્પલાઇન 1930 પર જાણ કરો." if risk_level == "HIGH RISK" else "અજાણી લિંક્સથી સાવધાન રહો અને માત્ર સત્તાવાર બેંકિંગ એપ્લિકેશનનો જ ઉપયોગ કરો.",
            "category_label": "બેંક / સંસ્થા પ્રતિરૂપતા" if "Bank" in category or "KYC" in category else "છેતરપિંડી સંદેશ",
            "risk_label": "ઉચ્ચ જોખમ (HIGH RISK)" if risk_level == "HIGH RISK" else "શંકાસ્પદ (SUSPICIOUS)" if risk_level == "SUSPICIOUS" else "સલામત (LOW RISK)"
        }
    }

    return {
        "summary": summary_en,
        "plain_reasons": plain_reasons_en,
        "recommended_action": recommended_action_en,
        "multilingual": translations
    }
