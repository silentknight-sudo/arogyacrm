# Arogya CRM

A high-end, production-ready CRM built for Ayurvedic wellness supplement businesses. Optimized for zero-error deployment on Vercel with a premium enterprise UI.

## Vercel Deployment Setup

To prevent **Error 500** and ensure stable Admin SDK initialization, you MUST configure the following Environment Variables in your Vercel Project Settings:

### 1. Required Variables
| Key | Value Source |
| :--- | :--- |
| `FIREBASE_PROJECT_ID` | `project_id` from your service account JSON |
| `FIREBASE_CLIENT_EMAIL` | `client_email` from your service account JSON |
| `FIREBASE_PRIVATE_KEY` | `private_key` (Paste the entire block including BEGIN/END lines) |

### 2. Private Key Instruction (Vercel)
When adding `FIREBASE_PRIVATE_KEY` to Vercel:
1. Copy the value of `private_key` from your JSON file.
2. It should start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----`.
3. Paste the **entire block** into the Vercel "Value" field.
4. Our resilient parser will automatically handle any newline escaping or formatting issues.

## Advanced Features
- **Industrial Admin Singleton**: Zero-crash initialization for serverless environments.
- **Glassmorphic UI**: Premium "Forest & Gold" aesthetic with advanced micro-interactions.
- **AI-Powered Insights**: Automated lead scoring and interaction summarization.
- **Scalable Discovery**: Robust member-based filtering for all assignments.
