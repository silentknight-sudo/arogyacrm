# Arogya CRM

This is a Next.js CRM application built for Ayurvedic wellness supplement businesses.

## Getting Started

The application is configured to run with Firebase. Ensure your Firebase project is set up and the configuration in `src/firebase/config.ts` is correct.

- **Run the development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Start the production server:** `npm run start`

## Vercel Deployment Setup

To prevent **Error 500** and authentication crashes on Vercel, you must configure the following Environment Variables in your Vercel Project Settings:

### 1. Get your Service Account JSON
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click the **Gear Icon** (Project Settings) > **Service accounts**.
4. Click **Generate new private key**. This downloads a JSON file.

### 2. Add Variables to Vercel
Go to **Vercel Dashboard > Your Project > Settings > Environment Variables** and add:

| Key | Value (from JSON) |
| :--- | :--- |
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key` (Include the entire string with BEGIN/END blocks) |

## Features

- User & Teamspace Management (Admin)
- Lead, Contact, Account, and Deal Management
- Activity Tracking (Tasks, Meetings, Calls)
- Marketing Campaign Management
- Inventory Management (Products, Quotes, Orders, Invoices)
- Customer Support (Tickets, Complaints, Refunds)
- Analytics & Reporting Dashboard
- AI-Powered Lead Scoring & Summarization
