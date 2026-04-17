import crypto from 'crypto';

/**
 * STRATEGIC META CAPI SERVICE
 * Handles SHA-256 hashing and event transmission for Meta Conversions API.
 */

function hashData(data: string): string {
  if (!data) return '';
  const normalized = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export type MetaEventData = {
  eventName: string;
  leadId?: string;
  email?: string;
  phone?: string;
  customData?: Record<string, any>;
};

export async function sendMetaCapiEvent(event: MetaEventData) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const datasetId = process.env.META_DATASET_ID;

  if (!accessToken || !datasetId) {
    console.warn('META_CAPI_SKIPPED: Access Token or Dataset ID missing.');
    return;
  }

  try {
    const userData: any = {
      client_user_agent: 'Arogya-CRM-Server',
    };

    if (event.leadId) userData.lead_id = event.leadId;
    if (event.email) userData.em = [hashData(event.email)];
    if (event.phone) userData.ph = [hashData(event.phone)];

    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'system_generated',
          user_data: userData,
          custom_data: {
            event_source: 'crm',
            lead_event_source: 'Arogya CRM',
            ...event.customData,
          },
        },
      ],
    };

    const response = await fetch(`https://graph.facebook.com/v21.0/${datasetId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.error) {
      console.error('META_CAPI_ERROR:', result.error);
    } else {
      console.log(`META_CAPI_SUCCESS: Sent "${event.eventName}" event.`);
    }
  } catch (error) {
    console.error('META_CAPI_CRITICAL_FAILURE:', error);
  }
}
