// Lightweight OneSignal integration for the React app
// This file injects the OneSignal SDK (if not present) and exposes helpers
// used by components in the app: initializeOneSignal, getOneSignalUserId, sendNotification

const ONESIGNAL_SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const APP_ID = process.env.REACT_APP_ONESIGNAL_APP_ID || 'a95b8d8a-b792-4c3a-a6c6-d2e88f5bc9dc';
const SAFARI_WEB_ID = process.env.REACT_APP_ONESIGNAL_SAFARI_WEB_ID || 'web.onesignal.auto.1f1e5b5b-9f41-4253-8171-f20d7e1a840b';

function injectSdk() {
  if (typeof window === 'undefined') return;
  if (window.OneSignal) return; // already loaded
  if (document.querySelector(`script[data-onesignal-sdk]`)) return;

  const s = document.createElement('script');
  s.src = ONESIGNAL_SDK_URL;
  s.defer = true;
  s.setAttribute('data-onesignal-sdk', 'true');
  document.head.appendChild(s);
}

// initializeOneSignal: injects SDK and schedules init via OneSignalDeferred
export function initializeOneSignal() {
  if (typeof window === 'undefined') return false;

  try {
    injectSdk();

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        // ドメイン制限を回避するため、開発環境では初期化をスキップ
        const currentHostname = window.location.hostname;
        const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
        const isVercelDev = currentHostname.includes('vercel.app') && currentHostname.includes('-');
        
        if (isLocalhost || isVercelDev) {
          return false;
        }

        await OneSignal.init({
          appId: APP_ID,
          safari_web_id: SAFARI_WEB_ID,
          notifyButton: { enable: true },
        });

      } catch (err) {
        console.error('OneSignal init error', err);
      }
    });

    return true;
  } catch (err) {
    console.error('initializeOneSignal failed', err);
    return false;
  }
}

export async function getOneSignalUserId() {
  if (typeof window === 'undefined' || !window.OneSignalDeferred) return null;

  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        const id = await (OneSignal.getUserId ? OneSignal.getUserId() : OneSignal.getSubscriptionId && OneSignal.getSubscriptionId());
        resolve(id || null);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

// sendNotification: uses OneSignal REST API via existing serverless function if available
// But for client-side test notifications we use the OneSignal SDK push
export async function sendNotification(title, message, opts = {}) {
  if (typeof window === 'undefined' || !window.OneSignalDeferred) return false;

  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.showNotification({
          title,
          message,
          ...opts,
        });
        resolve(true);
      } catch (err) {
        // fallback: use Notification API if available
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: opts.icon });
            resolve(true);
            return;
          }
        } catch (e) {}
        resolve(false);
      }
    });
  });
}

const oneSignalExports = { initializeOneSignal, getOneSignalUserId, sendNotification };
export default oneSignalExports;
// OneSignal設定ファイル
export const ONESIGNAL_CONFIG = {
  // OneSignal App ID（環境に応じて切り替え）
  appId: (() => {
    // 開発環境用のApp ID（新しく作成する必要があります）
    const DEV_APP_ID = process.env.REACT_APP_ONESIGNAL_DEV_APP_ID;
    // 本番環境用のApp ID
    const PROD_APP_ID = process.env.REACT_APP_ONESIGNAL_APP_ID || 'a95b8d8a-b792-4c3a-a6c6-d2e88f5bc9dc';
    
    // localhost環境では開発用App IDを使用
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return DEV_APP_ID || 'DEVELOPMENT_MODE';
    }
    
    return PROD_APP_ID;
  })(),
  
  // 自動初期化を有効にするかどうか
  autoRegister: true,
  
  // 通知の許可を自動でリクエストするかどうか
  autoResubscribe: true,
  
  // デバッグモード（開発時のみ）
  debug: process.env.NODE_ENV === 'development',
  
  // 通知のデフォルト設定
  notificationClickHandlerMatch: 'origin',
  notificationClickHandlerAction: 'navigate',
  
  // サブスクリプション設定
  allowLocalhostAsSecureOrigin: true,
  
  // カスタム設定
  promptOptions: {
    slidedown: {
      enabled: true,
      autoPrompt: true,
      timeDelay: 10,
      pageViews: 1,
      actionMessage: "このサイトからの通知を受け取りますか？",
      acceptButton: "許可",
      cancelButton: "キャンセル"
    }
  }
};

// OneSignalの初期化関数（v16対応）
export function initializeOneSignalV16() {
  if (typeof window !== 'undefined') {
    // 既に初期化済みかチェック
    if (window.OneSignalInitialized) {
      console.log('⚠️ OneSignalは既に初期化済みです');
      return true;
    }

    // ドメイン制限を回避するため、開発環境では初期化をスキップ
    const currentHostname = window.location.hostname;
    const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
    const isVercelDev = currentHostname.includes('vercel.app') && currentHostname.includes('-');
    
    if (isLocalhost || isVercelDev) {
      return false;
    }


    // 初期化フラグを設定
    window.OneSignalInitialized = true;

    // OneSignal v16の初期化方法
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        // 既にOneSignalが初期化されているかチェック
        if (OneSignal.User && OneSignal.User.PushSubscription) {
          return true;
        }
        
        // 本番環境用の設定
        const initConfig = {
          appId: 'a95b8d8a-b792-4c3a-a6c6-d2e88f5bc9dc',
          safari_web_id: 'web.onesignal.auto.1f1e5b5b-9f41-4253-8171-f20d7e1a840b',
          notifyButton: { enable: true },
          allowLocalhostAsSecureOrigin: true,
        };
        
        await OneSignal.init(initConfig);
        
        // 初期化後にプロンプトを表示
        try {
          await OneSignal.Slidedown.promptPush();
        } catch (error) {
          // プロンプト表示エラーは無視
        }
        
        return true;
      } catch (error) {
        console.error('OneSignal初期化エラー:', error);
        return false;
      }
    });
    return true;
  }
  return false;
}

// 通知の送信関数（本番環境用）
export async function sendNotificationV16(title, message, data = {}) {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      // 標準のNotification APIを使用（OneSignal v16では推奨）
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: data.icon || '/logo192.png',
            badge: data.badge || '/logo192.png',
            tag: data.tag,
            data: data
          });
          resolve(true);
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, {
                body: message,
                icon: data.icon || '/logo192.png',
                badge: data.badge || '/logo192.png',
                tag: data.tag,
                data: data
              });
              resolve(true);
            } else {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}

// ユーザーIDの取得（v16対応）
export function getOneSignalUserIdV16() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          // v16では異なる方法で購読IDを取得
          const subscription = await OneSignal.User.PushSubscription;
          const userId = subscription ? subscription.id : null;
          resolve(userId);
        } catch (error) {
          // フォールバック: 直接window.OneSignalから取得を試行
          try {
            const fallbackId = window.OneSignal.getUserId ? window.OneSignal.getUserId() : null;
            resolve(fallbackId);
          } catch (fallbackError) {
            resolve(null);
          }
        }
      });
    } else {
      resolve(null);
    }
  });
}

// 通知の許可状態をチェック（本番環境用）
export function checkNotificationPermission() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      // 標準のNotification APIを使用
      const permission = 'Notification' in window ? Notification.permission : 'denied';
      resolve(permission);
    } else {
      resolve('denied');
    }
  });
}




