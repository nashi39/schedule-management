// 簡易スケジューラ: アプリ起動中にローカルストレージの予定時刻を監視し通知を表示
// 注意: ブラウザ/タブが閉じられている場合は動作しません（Web Pushが必要）

const POLL_INTERVAL_MS = 30 * 1000; // 30秒ごとにチェック
const NOTIFICATION_WINDOW_MS = 60 * 1000; // 1分以内の到達を通知
const NOTIFIED_KEY = 'notifiedScheduleIds';

function getNow() {
  return new Date();
}

function loadSchedules() {
  try {
    const raw = localStorage.getItem('schedules');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadNotifiedSet() {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveNotifiedSet(set) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

async function showLocalNotification(title, options) {
  // Service Worker経由で表示できればそちらを優先
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch {}
  // Fallback: Window Notification（タブがフォアグラウンドの時のみ）
  try {
    // eslint-disable-next-line no-new
    new Notification(title, options);
  } catch {}
}

async function maybeNotify(schedule, notifiedSet) {
  const { id, title, description, date, priority, location } = schedule;
  if (!id || notifiedSet.has(id)) return;

  const scheduledAt = new Date(date);
  const now = getNow();
  const diff = Math.abs(scheduledAt.getTime() - now.getTime());

  // 予定時刻に到達（±1分）したら通知
  if (diff <= NOTIFICATION_WINDOW_MS && scheduledAt <= now) {
    const permission = 'Notification' in window ? Notification.permission : 'denied';
    if (permission !== 'granted') return;

    const bodyParts = [];
    if (description) bodyParts.push(description);
    if (location) bodyParts.push(`場所: ${location}`);

    await showLocalNotification(title || 'スケジュール', {
      body: bodyParts.join('\n') || 'スケジュールの時間になりました',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `schedule-${id}`,
      data: { id },
      silent: false,
    });

    notifiedSet.add(id);
    saveNotifiedSet(notifiedSet);
  }
}

export function startScheduleNotificationPolling() {
  // HTTPSまたはlocalhostでのみ動作（通知権限が必要）
  if (!('Notification' in window)) return () => {};
  if (!(window.isSecureContext || window.location.hostname === 'localhost')) return () => {};

  let timerId = null;
  const notifiedSet = loadNotifiedSet();

  const tick = async () => {
    const schedules = loadSchedules();
    await Promise.all(schedules.map((s) => maybeNotify(s, notifiedSet)));
  };

  // 即時チェックしてから一定間隔でポーリング
  tick();
  timerId = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    if (timerId) clearInterval(timerId);
  };
}

export function resetNotified() {
  try {
    localStorage.removeItem(NOTIFIED_KEY);
  } catch {}
}


