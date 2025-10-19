// OneSignal SDKを使用したスケジューラ: Web Push通知をサポート
import { sendNotification, checkNotificationPermission } from '../config/onesignal';
import { isSameDay, addDays, addWeeks, addMonths, addYears, isWithinInterval, isAfter, isBefore } from 'date-fns';

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

// 繰り返しスケジュールの展開ロジック
function expandRecurringSchedule(schedule, targetDate) {
  if (schedule.scheduleType !== 'recurring') return false;
  
  const startDate = new Date(schedule.date);
  const endDate = new Date(schedule.recurringEndDate);
  
  // 対象日が期間外の場合は除外
  if (isBefore(targetDate, startDate) || isAfter(targetDate, endDate)) {
    return false;
  }
  
  const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
  
  switch (schedule.recurringType) {
    case 'daily':
      return daysDiff % schedule.recurringInterval === 0;
    case 'weekly':
      return daysDiff % (schedule.recurringInterval * 7) === 0;
    case 'monthly':
      // 月次は近似計算（より正確には日付の比較が必要）
      const monthsDiff = Math.floor(daysDiff / 30);
      return monthsDiff % schedule.recurringInterval === 0 && 
             targetDate.getDate() === startDate.getDate();
    case 'yearly':
      // 年次は近似計算
      const yearsDiff = Math.floor(daysDiff / 365);
      return yearsDiff % schedule.recurringInterval === 0 &&
             targetDate.getMonth() === startDate.getMonth() &&
             targetDate.getDate() === startDate.getDate();
    default:
      return false;
  }
}

// 期間指定スケジュールの判定
function isWithinPeriodSchedule(schedule, targetDate) {
  if (schedule.scheduleType !== 'period') return false;
  
  const startDate = new Date(schedule.periodStartDate);
  const endDate = new Date(schedule.periodEndDate);
  
  return isWithinInterval(targetDate, { start: startDate, end: endDate });
}

// スケジュールが通知対象かチェック
function shouldNotifySchedule(schedule, now) {
  if (schedule.scheduleType === 'single' || !schedule.scheduleType) {
    const scheduledAt = new Date(schedule.date);
    const diff = Math.abs(scheduledAt.getTime() - now.getTime());
    return diff <= NOTIFICATION_WINDOW_MS && scheduledAt <= now;
  }
  
  if (schedule.scheduleType === 'recurring') {
    return expandRecurringSchedule(schedule, now);
  }
  
  if (schedule.scheduleType === 'period') {
    return isWithinPeriodSchedule(schedule, now);
  }
  
  return false;
}

async function maybeNotify(schedule, notifiedSet) {
  const { id, title, description, location } = schedule;
  if (!id) return;

  // 通知済みチェック（繰り返しスケジュールは日付ベースで管理）
  const now = getNow();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notificationKey = schedule.scheduleType === 'recurring' ? 
    `${id}-${today.toISOString().split('T')[0]}` : id;
  
  if (notifiedSet.has(notificationKey)) return;

  if (!shouldNotifySchedule(schedule, now)) return;

  // OneSignalの通知許可をチェック（v16対応でPromiseを返すため）
  const permission = await checkNotificationPermission();
  if (permission !== 'granted') {
    console.log('通知許可がありません:', permission);
    return;
  }

  const bodyParts = [];
  if (description) bodyParts.push(description);
  if (location) bodyParts.push(`場所: ${location}`);
  
  // スケジュールタイプの情報を追加
  if (schedule.scheduleType === 'recurring') {
    const recurringLabels = {
      daily: '日次',
      weekly: '週次',
      monthly: '月次',
      yearly: '年次'
    };
    bodyParts.push(`🔄 ${recurringLabels[schedule.recurringType] || '繰り返し'}`);
  } else if (schedule.scheduleType === 'period') {
    bodyParts.push('📅 期間指定');
  }

  await showNotification(title || 'スケジュール', {
    body: bodyParts.join('\n') || 'スケジュールの時間になりました',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: `schedule-${notificationKey}`,
    data: { id: notificationKey },
    silent: false,
  });

  notifiedSet.add(notificationKey);
  saveNotifiedSet(notifiedSet);
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


