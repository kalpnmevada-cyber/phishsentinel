# 🛡️ PhishGuard — Citizen Fraud-Message Guardian

**AI + Cybersecurity | Detects scam SMS, chat messages & links impersonating banks and government services, explains the risk in plain language, and lets you report it in one tap.**

> *"Check. Understand. Report."*

---

## 📌 Problem Statement

Citizens across India receive a constant stream of SMS, WhatsApp, and chat messages impersonating **banks (SBI, HDFC, ICICI...)** and **government services (Income Tax, UIDAI/Aadhaar, EPFO, India Post...)**. Most victims cannot tell a fake "your account will be blocked" message from a real one, and even when they suspect fraud, reporting it to authorities feels complicated — so most scams go unreported.

**PhishGuard** solves this by combining a multi-signal AI detection engine with a plain-language explanation layer and a one-tap reporting pipeline to the Indian Cyber Crime ecosystem.

---

## ✨ Key Features

- 🔍 **Multi-Signal Fraud Detection** — combines a deterministic rule engine, an SSRF-safe URL/domain analyzer, a trained ML classifier, and an optional LLM semantic layer into one unified 0–100 risk score.
- 🗣️ **Plain-Language Explanations** — every flag comes with a human-readable reason (not just a confidence score), available in **English, Hindi, and Gujarati**.
- 🚨 **Brand & Government Impersonation Detection** — recognizes 20+ known brands (SBI, HDFC, ICICI, Axis, PNB, Paytm, PhonePe, Income Tax Dept, UIDAI, EPFO, India Post, telecom operators, etc.) and cross-checks claimed identity against official domains.
- 🔗 **SSRF-Safe URL Analysis** — flags IP-based links, punycode/homoglyph domains, URL shorteners, high-risk TLDs, brand-domain mismatches, and deceptive subdomain stacking — all via string parsing, with **zero outbound network requests**.
- 🤖 **Trained ML Classifier** — a calibrated Linear SVM (TF-IDF, 1–2 grams) trained on 7,700+ real-world SMS records across multiple fraud corpora.
- 📷 **OCR / Screenshot Analysis** — extract and analyze text from forwarded screenshots of scam messages.
- 📲 **WhatsApp Bot Integration** — forward a suspicious message to the PhishGuard WhatsApp number and get an instant verdict.
- 📝 **One-Tap Incident Reporting** — auto-generates an incident report and submits it to a cybercrime-portal adapter (pluggable: demo simulator or live NCRP-style API), returning a trackable acknowledgement ID.
- 📄 **PDF Incident Reports** — downloadable, shareable PDF evidence for filing with authorities or banks.
- 📊 **Analytics Dashboard** — risk distribution, most-impersonated brands, category trends, and detection timeline.
- 🔐 **Privacy & Compliance by Design** — DPDPA-aligned consent logging, data export, and "right to erasure" endpoints; rate-limiting and hardened security headers on every request.

---

## 🧠 How Detection Works — The 4-Signal Pipeline

```
User Message / Link
       │
       ▼
┌─────────────────────┐
│ 1. Preprocessing &   │  Entity extraction, URL discovery, privacy sanitization
│    Entity Extraction │
└─────────┬────────────┘
          ▼
┌─────────────────────┐   Deterministic keyword/regex heuristics:
│ 2. Rule Engine        │  urgency, threats/coercion, credential requests,
│                       │  lottery/reward lures, malicious APK prompts,
│                       │  known brand/government identity matching
└─────────┬────────────┘
          ▼
┌─────────────────────┐   SSRF-safe string-only parsing:
│ 3. URL & Domain       │  IP-as-hostname, punycode, URL shorteners,
│    Analyzer           │  high-risk TLDs, brand-domain mismatch,
│                       │  deceptive subdomain/hyphen stacking
└─────────┬────────────┘
          ▼
┌─────────────────────┐   Calibrated Linear SVM (TF-IDF 1-2 grams,
│ 4. ML Classifier       │  sublinear TF, class-balanced) trained on
│                       │  7,700+ labeled SMS across 3 corpora
└─────────┬────────────┘
          ▼
┌─────────────────────┐   Optional deep semantic layer (LLM), with a
│ 5. LLM Semantic Layer │  fully deterministic offline fallback when no
│    (optional)         │  API key is configured — the app never
│                       │  requires an external AI provider to work
└─────────┬────────────┘
          ▼
┌─────────────────────┐
│ 6. Risk Engine         │  Synthesizes all 4 signals into a single
│    (Score Synthesis)  │  0–100 score + risk band (LOW / SUSPICIOUS /
│                       │  HIGH RISK) with full signal-by-signal breakdown
└─────────┬────────────┘
          ▼
┌─────────────────────┐
│ 7. Explanation Engine │  Converts fired indicators into plain-language
│    (Multilingual)     │  reasons + recommended action, in EN / HI / GU
└─────────┬────────────┘
          ▼
   Verdict shown to user → One-tap "Report" → Incident logged,
   PDF generated, submitted to Cyber Crime Portal adapter
```

### Why a Rule Engine *and* an ML Model?

| | Rule Engine | ML Classifier |
|---|---|---|
| **Explainability** | Inherently transparent — every rule *is* a plain-language reason | Statistical, needs separate explanation |
| **Certainty on known patterns** | 100% deterministic (e.g. "asks for OTP" → instant flag) | Probabilistic |
| **Handles novel/paraphrased scams** | Limited to known patterns | Generalizes via learned linguistic patterns |
| **Speed** | Microseconds, no inference cost | Fast but heavier than regex |
| **Update agility** | New scam pattern → add one rule instantly | Requires retraining |

Both run **in parallel** and their scores are combined by the Risk Engine — the rule engine gives instant, explainable certainty on known fraud patterns (impersonation, credential harvesting, threats, malicious APKs), while the ML classifier catches paraphrased or novel scam language that no fixed rule would match.

---

## 🏗️ Tech Stack

**Backend**
- **FastAPI** (Python) — REST API with custom rate-limiting & security-header middleware
- **SQLAlchemy** + SQLite (swappable via `DATABASE_URL`) — persistence for analyses, reports, consent logs, model metrics
- **scikit-learn** (Linear SVM, TF-IDF) — trained fraud classifier, serialized via `joblib`
- **httpx** — async calls to LLM providers, cybercrime portal, and WhatsApp Cloud API
- **Pydantic** — request/response schema validation

**Frontend**
- **React 18 + TypeScript** + **Vite**
- **Tailwind CSS** for styling, **Recharts** for the analytics dashboard
- **React Router** for navigation, **Axios** for API calls
- Built-in **Language Context** (EN / HI / GU) and **Theme Context** (light/dark)

**ML Pipeline**
- Trained on `combined_fraud_sms_dataset.xlsx` (7,742 raw records across `financial_scams_detection`, `spam_ham_india`, and `sms_spam_collection` corpora)
- Model comparison run across Naive Bayes, Logistic Regression, Linear SVM, and Random Forest — **Linear SVM (Calibrated, Balanced)** selected on highest Spam F1-score
- **Test Set Performance:** 97.85% accuracy · 95.09% Spam F1
- **Financial-Scam Subset Performance (PS-specific):** 96.67% F1 · 98.71% Recall

---

## 📂 Project Structure

```
abc/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, middleware, security headers
│   │   ├── core/config.py         # Environment-driven settings
│   │   ├── api/endpoints.py       # All REST routes
│   │   ├── services/
│   │   │   ├── preprocessing.py       # Entity extraction & privacy sanitization
│   │   │   ├── rule_engine.py         # Deterministic fraud heuristics
│   │   │   ├── url_analyzer.py        # SSRF-safe URL/domain analysis
│   │   │   ├── ml_service.py          # Trained classifier inference
│   │   │   ├── llm_service.py         # Optional LLM semantic layer
│   │   │   ├── risk_engine.py         # 4-signal score synthesis
│   │   │   ├── explanation_engine.py  # Plain-language, multilingual explanations
│   │   │   ├── pdf_generator.py       # Incident report PDF generation
│   │   │   └── ocr_service.py         # Screenshot text extraction
│   │   ├── adapters/
│   │   │   ├── reporting.py       # Cybercrime portal adapter (Demo / Live)
│   │   │   └── whatsapp.py        # WhatsApp Cloud API adapter (Demo / Live)
│   │   ├── db/                    # SQLAlchemy models, session, seed data
│   │   ├── schemas/               # Pydantic request/response models
│   │   └── tests/                 # Test suite
│   └── ml/
│       ├── model.joblib               # Trained classifier artifact
│       ├── evaluation_report.md/.json # Full model evaluation
│       └── combined_fraud_sms_dataset.xlsx
└── frontend/
    └── src/
        ├── pages/          # Analyze, Dashboard, Findings, Reports, Settings, WhatsApp, Privacy
        ├── components/     # AnalysisResultCard, ConsentModal, Navbar, Footer
        ├── context/        # Language & Theme providers
        └── utils/api.ts    # Backend API client
```

---

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000` (interactive docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Copy `frontend/.env.example` and the backend equivalent, then configure as needed:

| Variable | Purpose | Required? |
|---|---|---|
| `DATABASE_URL` | Database connection string | No (defaults to SQLite) |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | Enables the optional LLM semantic layer | No — app runs fully offline without it |
| `CYBERCRIME_PORTAL_ENABLED`, `CYBERCRIME_PORTAL_API_KEY` | Switches from demo to live cybercrime-portal submission | No |
| `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Enables live WhatsApp Cloud API integration | No |

> PhishGuard is designed to be **fully functional with zero external API keys** — the rule engine, URL analyzer, and trained ML classifier all run locally, and the LLM layer & reporting adapters gracefully fall back to deterministic/demo modes.

---

## 🔌 API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Run full 4-signal analysis on a message/URL |
| `/api/analyses` | GET | List past analyses |
| `/api/analyses/{id}` | GET | Get a specific analysis |
| `/api/reports` | POST | Create an incident report from an analysis |
| `/api/reports/{id}/submit` | POST | Submit report to Cyber Crime Portal adapter (one-tap report) |
| `/api/reports/{id}/pdf` | GET | Download the incident report as PDF |
| `/api/ocr` | POST | Extract text from an uploaded screenshot |
| `/api/whatsapp/webhook` | GET/POST | WhatsApp Cloud API webhook (verify + inbound messages) |
| `/api/stats` | GET | Dashboard analytics |
| `/api/model/metrics` | GET | Full ML model evaluation report |
| `/api/consent` | POST | Log a DPDPA consent event |
| `/api/privacy/export` | GET | Export all stored user data |
| `/api/privacy/data` | DELETE | Erase all stored user data ("right to erasure") |
| `/api/health` | GET | Health check |

---

## 🔐 Security & Privacy Highlights

- **SSRF-safe URL analysis** — all link inspection is done via string parsing only; PhishGuard never makes outbound requests to a URL supplied by a user.
- **Prompt-injection resistant LLM layer** — the LLM system prompt explicitly instructs the model to treat all message content as untrusted data to analyze, never as instructions to follow.
- **Rate limiting** — sliding-window IP-based limits on `/api/analyze`, `/api/reports`, and `/api/ocr`.
- **Hardened HTTP headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` set on every response.
- **DPDPA-aligned** — consent logging, data export, and full data-erasure endpoints built in from day one.

---

## 📈 Model Evaluation Summary

| Metric | Overall Test Set | Financial-Scam Subset (PS-specific) |
|---|---|---|
| Accuracy | 97.85% | 95.95% |
| Precision (Scam) | 94.53% | 94.72% |
| Recall (Scam) | 95.65% | 98.71% |
| F1-Score (Scam) | 95.09% | 96.67% |

Full breakdown (per-corpus accuracy, confusion matrices, candidate model comparison) is available in [`backend/ml/evaluation_report.md`](backend/ml/evaluation_report.md).

---

## 🗺️ Roadmap / Future Enhancements

- [ ] TRAI DLT sender-ID cross-verification for SMS
- [ ] Federated / on-device inference for stronger privacy guarantees
- [ ] Crowdsourced scam-link blocklist shared across users
- [ ] Additional regional languages beyond Hindi & Gujarati
- [ ] Voice read-out of verdicts for elderly/first-time smartphone users

---

## 📄 License

Add your license of choice here (e.g. MIT).

---

## 🙌 Acknowledgements

Built for the **AI + Cybersecurity** hackathon problem statement: *"A tool that flags scam SMS, chat messages, and links impersonating banks or government services, with a plain-language reason for each flag and a one-tap way to report it."*
