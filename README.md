# Arogya CRM

A high-end, production-ready CRM built for Ayurvedic wellness supplement businesses. Optimized for zero-error deployment across all environments with a premium enterprise UI.

## 🚀 Meta Direct Integration (Live Leads & Conversion Events)

To receive leads directly from Facebook/Instagram ads into your CRM and send conversion events back to Meta, follow these steps:

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

### 3. Configure Conversions API (CAPI)
- In Events Manager, go to **Settings** and find your **Dataset ID** (formerly Pixel ID). Add this as `META_DATASET_ID`.
- Generate an **Access Token** under the Conversions API section. Add this as `META_ACCESS_TOKEN`.
- The CRM will automatically send "Lead" events when a lead arrives and "Converted" events when a specialist moves a lead to the "done" stage.

### 4. Required Environment Variables
| Key | Description |
| :--- | :--- |
| `META_VERIFY_TOKEN` | The secret string you used in Step 2. |
| `META_ACCESS_TOKEN` | The Page Access Token from Step 3. |
| `META_DATASET_ID` | Your Pixel/Dataset ID from Events Manager. |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID. |
| `FIREBASE_CLIENT_EMAIL` | Your Firebase Service Account Email. |
| `FIREBASE_PRIVATE_KEY` | Your Firebase Service Account Private Key. |

### 5. Testing
Use the [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing) to send a test lead. It will appear instantly in your **Prospect Pipeline** under the "New" status. Use the **Payload Helper** in Events Manager to verify conversion events are arriving.

---

## Advanced Features
- **Resilient Admin Singleton**: Defer-initialization architecture that prevents build-time crashes.
- **Glassmorphic UI**: Premium "Forest & Gold" aesthetic with advanced `backdrop-blur-3xl`.
- **Meta Direct Sync**: Real-time webhook ingestion for automated lead capture.
- **Conversions API**: Automated feedback loop to optimize ad attribution via CRM stage changes.
- **AI-Powered Insights**: Automated lead scoring and interaction summarization via Genkit.
