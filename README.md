# TaxOS 🏛️🤖

TaxOS is a next-generation, AI-augmented tax operations platform designed to eliminate the fragmentation, manual bottlenecks, and opacity inherent in traditional tax preparation workflows. It bridges the gap between intelligent document automation and enterprise-grade system reliability.

---

## 🚀 Tech Stack

* **Frontend & Framework:** Next.js (App Router), TypeScript, Tailwind CSS
* **Database & ORM:** Supabase (PostgreSQL), Prisma ORM with `@prisma/adapter-pg` driver adapter for serverless optimization
* **AI Engine:** Google Gemini SDK (`@google/genai`) utilizing multimodal inputs and strict JSON schema structured outputs (`responseSchema`)

---

## 🌟 Key Architectural Features & Solved Challenges

TaxOS was engineered to address 10 critical UX and system architecture challenges in modern financial operations:

1. **Actionable Dashboards & Urgency Scoring:** Automated priority sorting (`orderBy: { urgencyScore: 'desc' }`) to surface high-risk or imminent-deadline returns instantly.
2. **Trustworthy AI Transparency:** Clear AI confidence scores paired with plain-language explanations detailing *how* and *why* numbers were extracted.
3. **Source Document Traceability:** Relational metadata linking every extracted field directly back to its source document name, page number, and section.
4. **Interaction Affordances:** Visual state management (`AI_EXTRACTED`, `VERIFIED`, `FLAGGED`) to track the lifecycle of every data point.
5. **Role-Aware Workflows:** Dynamic role mapping supporting `Client`, `Preparer`, and `Reviewer` perspectives with tailored permissions.
6. **Client & CPA Collaboration:** Integrated comment threads and messaging streams tied directly to individual fields or broad returns.
7. **Navigable Complexity:** Modular, tabbed interfaces breaking down dense multi-form data to reduce cognitive overload.
8. **Approval and Lock Workflows:** Interactive state-transition controls that lock records down once a reviewer signs off.
9. **Return Status Visibility & Blockers:** Transparent tracking of return status, action owners, and explicit JSON-stored blocker arrays.
10. **Type-Safe Persistence:** A robust architecture leveraging Prisma migrations, automated seeding scripts, and end-to-end type safety from database to UI.

---

## 🛠️ Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* A Supabase project (PostgreSQL database)
* A Gemini API Key from Google AI Studio
