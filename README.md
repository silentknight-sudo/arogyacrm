
# Arogya CRM

A high-end, production-ready CRM built for Ayurvedic wellness supplement businesses. Optimized for zero-error deployment across all environments with a premium enterprise UI.

## Environment Setup (CRITICAL)

To ensure the Admin SDK initializes correctly and prevents **PEM Parsing Errors**, configure these variables in your hosting environment (Vercel, Firebase App Hosting, etc.) or your `.env` file:

### Required Variables
| Key | Value Source |
| :--- | :--- |
| `FIREBASE_PROJECT_ID` | `project_id` from your service account JSON |
| `FIREBASE_CLIENT_EMAIL` | `client_email` from your service account JSON |
| `FIREBASE_PRIVATE_KEY` | `private_key` (The entire block including BEGIN/END lines) |

### Meta Integration (Direct Leads)
To receive leads directly from Facebook/Instagram, configure these variables:
| Key | Description |
| :--- | :--- |
| `META_VERIFY_TOKEN` | A secret string you create (e.g., `arogya_secure_link`) |
| `META_ACCESS_TOKEN` | Your Meta Page Access Token with `leads_retrieval` permissions |

**Webhook URL**: `https://your-domain.com/api/webhooks/meta`

## Advanced Features
- **Resilient Admin Singleton**: Defer-initialization architecture that prevents build-time crashes.
- **Glassmorphic UI**: Premium "Forest & Gold" aesthetic with advanced `backdrop-blur-3xl`.
- **Meta Direct Sync**: Real-time webhook ingestion for automated lead capture.
- **AI-Powered Insights**: Automated lead scoring and interaction summarization via Genkit.
