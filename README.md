
# Arogya CRM

A high-end, production-ready CRM built for Ayurvedic wellness supplement businesses. Optimized for zero-error deployment across all environments with a premium enterprise UI.

## 🚀 Meta Direct Integration (Live Leads)

To receive leads directly from Facebook/Instagram ads into your CRM in real-time, follow these steps:

### 1. Meta Developer Setup
- Go to [Meta for Developers](https://developers.facebook.com/).
- Create a new App (Type: "Other" -> "Business").
- Add the **Webhooks** product to your app.

### 2. Configure Webhook
- In the Webhooks settings, select **Page** from the dropdown.
- Click **Subscribe to this object**.
- **Callback URL**: `https://your-deployed-domain.com/api/webhooks/meta`
- **Verify Token**: Create a secret string (e.g., `arogya_secure_2024`). This must match your `META_VERIFY_TOKEN` env variable.
- After verifying, find the **leadgen** field in the list and click **Subscribe**.

### 3. Generate Access Token
- Go to the **App Dashboard** -> **Tools** -> **Graph API Explorer**.
- Select your App and the Page you want to track.
- Generate a **Page Access Token** with these permissions:
    - `leads_retrieval`
    - `pages_manage_ads`
    - `pages_show_list`
    - `pages_read_engagement`
- Add this token to your environment variables as `META_ACCESS_TOKEN`.

### 4. Required Environment Variables
| Key | Description |
| :--- | :--- |
| `META_VERIFY_TOKEN` | The secret string you used in Step 2. |
| `META_ACCESS_TOKEN` | The Page Access Token from Step 3. |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID. |
| `FIREBASE_CLIENT_EMAIL` | Your Firebase Service Account Email. |
| `FIREBASE_PRIVATE_KEY` | Your Firebase Service Account Private Key. |

### 5. Testing
Use the [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing) to send a test lead. It will appear instantly in your **Prospect Pipeline** under the "New" status.

---

## Advanced Features
- **Resilient Admin Singleton**: Defer-initialization architecture that prevents build-time crashes.
- **Glassmorphic UI**: Premium "Forest & Gold" aesthetic with advanced `backdrop-blur-3xl`.
- **Meta Direct Sync**: Real-time webhook ingestion for automated lead capture.
- **AI-Powered Insights**: Automated lead scoring and interaction summarization via Genkit.
