# Arogya CRM

A high-end, production-ready CRM built for Ayurvedic wellness supplement businesses. Optimized for zero-error deployment on Vercel with a premium enterprise UI.

## Vercel Deployment Setup (CRITICAL)

To prevent **PEM Parsing Errors** and ensure the Admin SDK initializes correctly, configure these variables in Vercel:

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
3. **Pasting Method**: Paste the *entire block* including the `\n` characters if they are present. Our industrial parser will automatically sanitize quotes, newlines, and double-escapes.

## Advanced Features
- **Hyper-Resilient Admin Singleton**: Zero-crash initialization specifically engineered for Vercel's multi-line environment variables.
- **Glassmorphic UI**: Premium "Forest & Gold" aesthetic with advanced `backdrop-blur-3xl` and herbal gradients.
- **AI-Powered Insights**: Automated lead scoring and interaction summarization via Genkit.
- **Scalable Discovery**: Robust `array-contains` member filtering for enterprise-scale teams.
