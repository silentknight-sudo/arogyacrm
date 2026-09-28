/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// The CRM's Next.js app runs on Firebase App Hosting, which has no built-in
// cron support (the app's vercel.json cron entry only works when deployed to
// Vercel). This scheduled function is what actually triggers lead sync in
// production, every minute, by calling the app's own cron endpoint, which
// then decides per-sheet whether that sheet's configured interval is due.
const SYNC_ENDPOINT = process.env.LEAD_SYNC_URL ||
  "https://studio--studio-3238704164-621f1.us-central1.hosted.app/api/cron/sync-leads";

export const syncGoogleSheetLeadsEveryMinute = onSchedule(
  { schedule: "every 1 minutes", region: "us-central1", retryCount: 0 },
  async () => {
    const headers: Record<string, string> = {};
    if (process.env.CRON_SECRET) {
      headers.Authorization = `Bearer ${process.env.CRON_SECRET}`;
    }

    const response = await fetch(SYNC_ENDPOINT, { headers });
    const body = await response.text();

    if (!response.ok) {
      logger.error("Lead sync cron call failed", { status: response.status, body });
      return;
    }

    logger.info("Lead sync cron call completed", { body });
  }
);
