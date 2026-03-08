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

### Private Key Instructions
When adding `FIREBASE_PRIVATE_KEY`:
1. Copy the value of `private_key` from your JSON file.
2. It should start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----`.
3. **Important**: Our industrial parser automatically handles literal `\n` characters and escaped backslashes. You can paste the value exactly as it appears in your JSON file.

## Advanced Features
- **Resilient Admin Singleton**: Defer-initialization architecture that prevents build-time crashes and Google Cloud trust loops.
- **Glassmorphic UI**: Premium "Forest & Gold" aesthetic with advanced `backdrop-blur-3xl` and herbal gradients.
- **AI-Powered Insights**: Automated lead scoring and interaction summarization via Genkit.
- **Scalable Discovery**: Robust `array-contains` member filtering for enterprise-scale teams.
