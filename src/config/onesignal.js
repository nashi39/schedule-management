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
          console.log('OneSignal: 開発環境のため初期化をスキップ', currentHostname);
          window.OneSignalDebugInfo = {
            initialized: false,
            skipped: true,
            reason: 'development environment',
            hostname: currentHostname,
            timestamp: new Date().toISOString()
          };
          return false;
        }

        await OneSignal.init({
          appId: APP_ID,
          safari_web_id: SAFARI_WEB_ID,
          notifyButton: { enable: true },
        });

        // store debug info for OneSignalDebug component
        window.OneSignalDebugInfo = {
          initialized: true,
          permission: Notification && Notification.permission,
          userId: null,
          timestamp: new Date().toISOString(),
        };

        // try to get user id if available
        try {
          const ids = await OneSignal.getUserId && OneSignal.getUserId();
          window.OneSignalDebugInfo.userId = ids || null;
        } catch (e) {
          // ignore
        }
      } catch (err) {
        window.OneSignalDebugInfo = { initialized: false, error: err.message, timestamp: new Date().toISOString() };
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
      console.log('OneSignal: 開発環境のため初期化をスキップ', currentHostname);
      window.OneSignalDebugInfo = {
        initialized: false,
        skipped: true,
        reason: 'development environment',
        hostname: currentHostname,
        timestamp: new Date().toISOString()
      };
      return false;
    }

    console.log('🔧 OneSignal初期化開始...');
    console.log('📱 App ID:', ONESIGNAL_CONFIG.appId);
    console.log('🌐 環境:', {
      isSecureContext: window.isSecureContext,
      hostname: window.location.hostname,
      protocol: window.location.protocol
    });

    // 初期化フラグを設定
    window.OneSignalInitialized = true;

    // OneSignal v16の初期化方法
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        // 既にOneSignalが初期化されているかチェック
        if (OneSignal.User && OneSignal.User.PushSubscription) {
          console.log('⚠️ OneSignal SDK は既に初期化されています');
          
          // 既存の状態を取得
          const permission = await OneSignal.Notifications.permission;
          const userId = await OneSignal.User.PushSubscription.id;
          
          window.OneSignalDebugInfo = {
            initialized: true,
            permission: permission,
            userId: userId,
            timestamp: new Date().toISOString()
          };
          return true;
        }

        console.log('🚀 OneSignal.init()実行中...');
        
        // 本番環境用の設定（強制的に本番App IDを使用）
        const initConfig = {
          appId: 'a95b8d8a-b792-4c3a-a6c6-d2e88f5bc9dc', // 本番App IDを直接指定
          safari_web_id: 'web.onesignal.auto.1f1e5b5b-9f41-4253-8171-f20d7e1a840b',
          notifyButton: { enable: true },
          allowLocalhostAsSecureOrigin: true,
        };
        
        console.log('🌍 本番モードで初期化します');
        
        await OneSignal.init(initConfig);
        
        // 記事の方式に合わせて、初期化後にプロンプトを表示
        try {
          await OneSignal.Slidedown.promptPush();
          console.log('📱 通知許可プロンプトを表示しました');
        } catch (error) {
          console.log('⚠️ プロンプト表示エラー（既に許可済みの可能性）:', error);
        }
        
        console.log('✅ OneSignal v16初期化成功');
        
        // 初期化後の状態をログ出力
        const permission = await OneSignal.Notifications.permission;
        const userId = await OneSignal.User.PushSubscription.id;
        
        console.log('📊 OneSignal状態:', {
          permission: permission,
          userId: userId,
          isSubscribed: !!userId
        });
        
        // グローバルに状態を保存（デバッグ用）
        window.OneSignalDebugInfo = {
          initialized: true,
          permission: permission,
          userId: userId,
          timestamp: new Date().toISOString()
        };
        
        return true;
      } catch (error) {
        console.error('❌ OneSignal初期化エラー:', error);
        window.OneSignalDebugInfo = {
          initialized: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        return false;
      }
    });
    return true;
  }
  console.warn('⚠️ ブラウザ環境ではありません');
  return false;
}

// 通知の送信関数（本番環境用）
export async function sendNotificationV16(title, message, data = {}) {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      console.log('🔔 本番モード通知送信:', title, message);
      
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
          console.log('✅ 通知送信成功');
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
              console.log('✅ 通知送信成功（許可後）');
              resolve(true);
            } else {
              console.log('❌ 通知許可が拒否されました');
              resolve(false);
            }
          });
        } else {
          console.log('❌ 通知許可がありません');
          resolve(false);
        }
      } else {
        console.log('❌ Notification APIがサポートされていません');
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
          console.log('購読ID取得:', userId);
          resolve(userId);
        } catch (error) {
          console.error('ユーザーID取得エラー:', error);
          // フォールバック: 直接window.OneSignalから取得を試行
          try {
            const fallbackId = window.OneSignal.getUserId ? window.OneSignal.getUserId() : null;
            console.log('フォールバック購読ID:', fallbackId);
            resolve(fallbackId);
          } catch (fallbackError) {
            console.error('フォールバック取得エラー:', fallbackError);
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




