# Tenrixa (AI Tender Risk Analysis Platform)

Smart AI for Safer Bidding.

Tenrixa is a modern full-stack SaaS that:
- Uses **Supabase Auth** for sign up / login / logout
- Enforces **role-based access** with DB-side security (RLS)
- Uploads **private PDF/DOCX tender documents** to **Supabase Storage**
- Extracts text, sends it to **OpenAI**, and stores structured **risk analysis JSON**
- Shows risk score breakdown (Financial / Legal / Timeline / Eligibility)
- Supports a monetization system:
  - **Free** plan: limited analyses quota
  - **Pro** plan: ₹4,999/month (unlimited)
  - **Pay-per-tender**: ₹999 per analysis via **Razorpay**
- Generates a downloadable **PDF risk report**

## Tech Stack
- Next.js (App Router, TypeScript)
- Supabase (Auth + Postgres + Storage + RLS)
- OpenAI API (structured JSON analysis)
- Razorpay (payments)
- Tailwind CSS + shadcn-like UI styling patterns + dark/light mode

## Prerequisites
- Node.js 18+
- A Supabase project
- OpenAI API key
- Razorpay account (test or production keys)

## 1) Configure Supabase
1. Create a Supabase project.
2. In Supabase SQL Editor, run:
   - `supabase/setup.sql`
3. Confirm the storage bucket:
   - `tender-docs` (must be **private**)
4. Supabase triggers/functions used by the app:
   - `consume_free_analysis(uid uuid) returns boolean`
   - `consume_tender_credit(uid uuid) returns boolean`

### Storage path convention (important)
The app uploads documents to Supabase Storage using this pattern:
- `<auth.uid>/<documentId>_<originalFilename>`

The RLS policy in `supabase/setup.sql` depends on this folder structure.

## 2) Set environment variables
Copy `.env.example` to `.env.local` and fill in the values.

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Optional:
- `OPENAI_MODEL` (defaults in code to `gpt-4o-mini`)
- `TENDER_DOCS_BUCKET` (defaults in code to `tender-docs`)

## 3) Install & run locally
From the project folder:
```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000`

## 4) Where the core features live
- Upload + AI analysis
  - `POST /api/tender-documents/presign`
  - `POST /api/ai/analyze`
  - `GET /api/ai/analyses/[analysisId]/pdf`
- Payments
  - `POST /api/payments/create-tender-order`
  - `POST /api/payments/verify-tender`
  - `POST /api/payments/create-pro-order`
  - `POST /api/payments/verify-pro`

## Notes on Security
- Tender documents are stored in a **private Supabase bucket**.
- RLS policies prevent users from reading others’ documents/analyses.
- The AI analysis endpoint checks document ownership before downloading/extracting.

## Deployment (Vercel-ready)
Set the same environment variables in your Vercel project.
Ensure your deployment uses Node.js runtime for API routes (default for Next).

