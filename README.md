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

### 2. Getting Your Credentials
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click the **Gear Icon** > **Project Settings** > **Service accounts**.
4. Click **Generate new private key**.
5. Copy the values from the downloaded JSON file into Vercel.

## Advanced Features
- **Industrial Admin Proxy**: Zero-crash initialization for serverless environments.
- **Glassmorphic UI**: Premium "Forest & Gold" aesthetic with advanced micro-interactions.
- **AI-Powered Insights**: Automated lead scoring and interaction summarization.
- **Scalable Discovery**: Robust member-based filtering for all assignments.
