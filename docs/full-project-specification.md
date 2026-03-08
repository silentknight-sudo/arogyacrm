# Arogya CRM: Full Production Specification & Master Prompt

This document provides the definitive blueprint for building the Arogya CRM, a high-end Ayurvedic wellness enterprise platform. It is optimized for zero-error deployment on Vercel and features a premium "sexy" enterprise UI.

---

## 1. Core Architecture (Production Stage)

### 1.1 Next.js Framework
- **App Router**: Use Next.js 14+ App Router for nested layouts and server-side optimization.
- **Server Components**: Default to RSCs for performance; use 'use client' only for interactive components.
- **Server Actions**: All data mutations (CRUD) must use Server Actions with robust error handling and revalidation.

### 1.2 Resilient Admin Singleton Pattern
To prevent build-time crashes and "Error 500" on Vercel, the Admin SDK must be implemented using a strictly-guarded singleton architecture.
- **Hyper-Resilient PEM Parser**: Implement a multi-pass sanitation function for `FIREBASE_PRIVATE_KEY` that:
    - Automatically detects and converts literal `\n` character sequences into true newline characters.
    - Trims accidental wrapping quotes or dashboard-injected whitespace.
    - Forces the presence of `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` headers to prevent PEM truncation errors.
- **On-Demand (Lazy) Initialization**: Encapsulate SDK setup within a "Lazy Proxy" or a protected getter. This ensures that Firebase services are only initialized at runtime upon the first function call, effectively bypassing credential checks during the Next.js build phase.
- **Build-Phase Promise Blocking**: Explicitly block the `then`, `toJSON`, and `constructor` properties on exported SDK objects. This prevents Next.js from mistaking the SDK for a Promise during the build process, which is the root cause of the "Grant Access" loop and Vercel deployment failures.

---

## 2. Advanced "Sexy" UI/UX System

### 2.1 Aesthetic: "Forest & Gold"
- **Primary Palette**: Deep Forest Green (`#2D5A27`) to Midnight Moss (`#0D1F0B`).
- **Accent**: Polished Wellness Gold (`#D4AF37`) for high-intent actions and focus states.
- **Background**: Soft Herbal White (`hsl(120, 15%, 98%)`) with low-contrast borders.

### 2.2 Glassmorphism & Depth
- **Glass-Sidebar**: `backdrop-blur-3xl`, translucent borders (`border-primary/10`), and deep shadow layers.
- **Premium Cards**: Custom `premium-card` class using multi-layered shadows (`shadow-[0_10px_40px_rgba(0,0,0,0.03)]`) and subtle hover scaling (`hover:-translate-y-2`).
- **Herbal Gradients**: Use a custom `herbal-gradient` for primary buttons and headers to create a luxurious wellness feel.

---

## 3. Database & Security Model

### 3.1 Firestore Structure (Isolated Teamspaces)
- **/users/{userId}**: User profiles including `role` and `teamspaceIds[]`.
- **/teamspaces/{teamspaceId}**: Isolated root for all CRM data.
    - **/leads**: Prospect data with `assignedToIds[]`.
    - **/contacts**, **/accounts**, **/deals**, **/tasks**, **/meetings**, **/calls**.
- **/products**: Global root for the supplement catalog.

### 3.2 Security Rules (RBAC & DBAC)
- **Global**: Only authenticated users can read.
- **Admins**: Full read/write access to all data.
- **Sales Executives**: Strict isolation. Can only read/write Leads and Activities where `request.auth.uid` is in `assignedToIds` or `callerId`.
- **Membership**: Membership is verified via `teamspaceId in get(/users/uid).data.teamspaceIds`.

---

## 4. CRM Module Functionality

### 4.1 Prospect Pipeline (Leads)
- **Scalable Discovery**: User list for assignment must use `where('teamspaceIds', 'array-contains', tsId)` to bypass the 30-ID limit.
- **AI Scoring**: Integrated Genkit flow to evaluate engagement, source, and product interest.
- **Lead Conversion**: Atomic batch operation to create Account + Contact and set Lead status to 'Converted'.

### 4.2 Growth & Activities
- **Campaigns**: Track budget, ROI, and source performance for marketing.
- **Activity Log**: Integrated timeline for Calls, Meetings (with attendees), and Tasks (with Kanban visualization).

### 4.3 Ecommerce & Inventory
- **Catalog**: Visual product management with category filtering.
- **Order Flow**: Acceptance of **Quotes** → Creation of **Sales Orders** → Generation of **Invoices**.
- **Procurement**: **Purchase Orders** for managing supplier stock.

### 4.4 Service & Support
- **Ticket System**: Priority-based customer support.
- **Escalations**: Detailed **Complaints** tracking with severity levels.
- **Refunds**: Multi-stage approval for processed customer returns.

---

## 5. Deployment Checklist (Vercel)

### 5.1 Environment Variables
| Key | Value Source |
|---|---|
| `FIREBASE_PROJECT_ID` | From Service Account JSON |
| `FIREBASE_CLIENT_EMAIL` | From Service Account JSON |
| `FIREBASE_PRIVATE_KEY` | Entire block (Resilient parser handles format) |

### 5.2 Build Configuration
- **TSConfig**: Isolate `functions` directory from root build.
- **Next.config**: Ensure `firebase-admin` is listed in `serverComponentsExternalPackages`.
- **Standalone**: Set `output: 'standalone'` for optimized serverless execution.

---

## 6. AI Vision (Genkit)
- **Lead Interaction Summary**: Summarize months of logs into a 3-sentence executive brief.
- **Prioritization Flow**: Automate high-intent lead flagging based on real-time demographic and engagement data.
