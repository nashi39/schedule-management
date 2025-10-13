// Vercel Serverless Function: Schedule OneSignal Push Notification
// Expects JSON body: { subscriptionId, title, message, sendAfterISO }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID || process.env.OS_APP_ID || process.env.REACT_APP_ONESIGNAL_APP_ID;
    const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY || process.env.OS_API_KEY;

    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) {
      return res.status(500).json({ error: 'OneSignal credentials are not configured on the server' });
    }

    const { subscriptionId, title, message, sendAfterISO } = req.body || {};

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId is required' });
    }
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    // Default: schedule 60s later if not provided
    const sendAfter = sendAfterISO || new Date(Date.now() + 60 * 1000).toISOString();

    const payload = {
      app_id: ONE_SIGNAL_APP_ID,
      include_subscription_ids: [subscriptionId],
      headings: { en: title },
      contents: { en: message },
      send_after: sendAfter,
      android_visibility: 1,
      ttl: 3600,
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'OneSignal API error', details: data });
    }

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
}




