# 🏛️ Zetsu: AICTE Security Deposit & FDR Management Portal

**Smart India Hackathon Problem Statement ID:** 26265  
**Department:** Regulation Bureau, All India Council for Technical Education (AICTE), Ministry of Education, Govt. of India  
**Project Name:** Zetsu  

---

## 🌟 Overview

**Zetsu** is an enterprise-grade, centralized, tamper-evident portal for streamlining the lifecycle management of Security Deposits and Fixed Deposit Receipts (FDRs) pledged by technical institutions to the AICTE. 

### 🏆 Key Differentiators

1. **Three-Tier Trust-Level Separation**:
   Every field and instrument carries verification provenance:
   - ⚪ `SUBMITTED`: Institution entered or initial OCR extracted
   - 🟡 `OFFICER_VERIFIED`: Verified against original documents by AICTE Scrutiny Officers
   - 🟢 `BANK_CONFIRMED`: Verified via direct Bank Adapter API integration

2. **Strict Lifecycle State Machine**:
   Guaranteed transition integrity across `DRAFT`, `SUBMITTED`, `UNDER_SCRUTINY`, `DISCREPANCY_FLAGGED`, `RESUBMISSION_REQUIRED`, `VERIFIED`, `ACTIVE`, `EXPIRING`, `RENEWAL_PENDING`, `OVERDUE`, `MATURED`, `RENEWED`, `RELEASE_REQUESTED`, `RELEASE_UNDER_REVIEW`, `RELEASE_APPROVED`, `RELEASE_REJECTED`, and `RELEASED`.

3. **Intelligent Discrepancy Detection Engine**:
   Real-time automated validation for missing docs, OCR mismatch, duplicate reference/document hash, short validity, amount below requirement, lien absence, and bank response mismatch.

4. **Tamper-Evident Hash-Chained Audit Trail**:
   Every state change, document access, and scrutiny decision is cryptographically linked with `prev_hash` + SHA256 chain, provable via on-demand audit verification.

5. **Multi-Stage Segregation of Duties Release Workflow**:
   Institutions request release -> Auto-eligibility checklist -> Scrutiny Officer Review -> Finance Officer Confirmation -> Competent Authority Final Approval -> Discharge Recording.

6. **Interactive Time-Travel Simulation**:
   Built-in demonstration control to fast-forward system dates and observe automated reminder triggers (90, 60, 30, 15, 7, 1 days) and escalation level changes in real time.

---

## 🏗️ Architecture

```
                       ┌───────────────────────────────────────────────┐
                       │               Zetsu Web App                   │
                       │  (Next.js 14, TypeScript, Tailwind, Lucide)   │
                       └───────────────────────┬───────────────────────┘
                                               │ REST API
                                               ▼
                       ┌───────────────────────────────────────────────┐
                       │               FastAPI Backend                 │
                       │ ┌──────────────┬──────────────┬─────────────┐ │
                       │ │ Auth & RBAC  │ State Machine│ Discrepancy │ │
                       │ ├──────────────┼──────────────┼─────────────┤ │
                       │ │ Bank Adapter │ OCR Pipeline │ Hash Audit  │ │
                       │ └──────────────┴──────────────┴─────────────┘ │
                       └─────┬──────────────┬──────────────────┬───────┘
                             │              │                  │
                             ▼              ▼                  ▼
                       ┌───────────┐ ┌─────────────┐   ┌───────────────┐
                       │PostgreSQL │ │  Redis &    │   │MinIO / Encrypt│
                       │ / SQLite  │ │ Celery Beat │   │ Document Store│
                       └───────────┘ └─────────────┘   └───────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ (tested on Node v22)
- Docker & Docker Compose (optional for local full-stack run)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

API Documentation will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The portal will be live at: `http://localhost:3000`

---

## 👥 Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Institution User** | `institution@iitdelhi.ac.in` | `Zetsu@2026Pass` |
| **Scrutiny Officer** | `scrutiny@aicte-india.org` | `Zetsu@2026Pass` |
| **Section Head** | `sectionhead@aicte-india.org` | `Zetsu@2026Pass` |
| **Finance Officer** | `finance@aicte-india.org` | `Zetsu@2026Pass` |
| **Competent Authority** | `director@aicte-india.org` | `Zetsu@2026Pass` |
| **Auditor** | `auditor@aicte-india.org` | `Zetsu@2026Pass` |
| **System Admin** | `admin@aicte-india.org` | `Zetsu@2026Pass` |

*(All users have TOTP MFA disabled by default for demo speed, but can be enabled in settings).*
