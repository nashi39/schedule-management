// Client utility to call Vercel API for scheduled push

export async function schedulePushNotification({ subscriptionId, title, message, sendAfterISO }) {
  const endpoint = '/api/schedule-push';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscriptionId, title, message, sendAfterISO }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to schedule push');
  }
  return res.json();
}




