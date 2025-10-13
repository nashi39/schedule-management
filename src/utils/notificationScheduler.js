// OneSignal SDKを使用したスケジューラ: Web Push通知をサポート
import { sendNotification, checkNotificationPermission } from '../config/onesignal';

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

async function showNotification(title, options) {
  // OneSignal SDKを使用して通知を送信
  try {
    const success = await sendNotification(title, options.body, {
      icon: options.icon,
      badge: options.badge,
      tag: options.tag,
      data: options.data
    });
    
    if (success) {
      console.log('OneSignal通知送信成功:', title);
      return;
    }
  } catch (error) {
    console.error('OneSignal通知送信エラー:', error);
  }
  
  // Fallback: 従来の通知方法
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch {}
  
  // 最後の手段: Window Notification（タブがフォアグラウンドの時のみ）
  try {
    // eslint-disable-next-line no-new
    new Notification(title, options);
  } catch {}
}

async function maybeNotify(schedule, notifiedSet) {
  const { id, title, description, date, location } = schedule;
  if (!id || notifiedSet.has(id)) return;

  const scheduledAt = new Date(date);
  const now = getNow();
  const diff = Math.abs(scheduledAt.getTime() - now.getTime());

  // 予定時刻に到達（±1分）したら通知
  if (diff <= NOTIFICATION_WINDOW_MS && scheduledAt <= now) {
    // OneSignalの通知許可をチェック（v16対応でPromiseを返すため）
    const permission = await checkNotificationPermission();
    if (permission !== 'granted') {
      console.log('通知許可がありません:', permission);
      return;
    }

    const bodyParts = [];
    if (description) bodyParts.push(description);
    if (location) bodyParts.push(`場所: ${location}`);

    await showNotification(title || 'スケジュール', {
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
  // OneSignal v16では初期化が非同期のため、OneSignalDeferredの存在をチェック
  if (typeof window === 'undefined') {
    console.warn('ブラウザ環境ではありません');
    return () => {};
  }
  
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


