import React, { useState, useEffect } from 'react';
import { sendNotification, getOneSignalUserId } from '../config/onesignal';
import { schedulePushNotification } from '../utils/onesignalApi';
import './OneSignalDebug.css';

function OneSignalDebug() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [testResult, setTestResult] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // デバッグ情報を定期的に更新
    const updateDebugInfo = () => {
      const info = window.OneSignalDebugInfo || { initialized: false };
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleTestNotification = async () => {
    setTestResult('テスト通知送信中...');
    try {
      const success = await sendNotification(
        'テスト通知',
        'OneSignalのテスト通知です。正常に動作しています！',
        { icon: '/logo192.png', tag: 'test-notification' }
      );
      
      if (success) {
        setTestResult('✅ テスト通知送信成功');
      } else {
        setTestResult('❌ テスト通知送信失敗');
      }
    } catch (error) {
      setTestResult(`❌ エラー: ${error.message}`);
    }
  };

  const handleRequestPermission = async () => {
    try {
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            await OneSignal.Notifications.requestPermission();
            setTestResult('✅ 通知許可をリクエストしました');
          } catch (error) {
            setTestResult(`❌ 許可リクエストエラー: ${error.message}`);
          }
        });
      }
    } catch (error) {
      setTestResult(`❌ エラー: ${error.message}`);
    }
  };

  const handleGetUserId = async () => {
    try {
      const userId = await getOneSignalUserId();
      setTestResult(userId ? `ユーザーID: ${userId}` : 'ユーザーIDが取得できませんでした');
    } catch (error) {
      setTestResult(`❌ エラー: ${error.message}`);
    }
  };

  const handleScheduleIn1min = async () => {
    setTestResult('1分後の予約通知を送信中...');
    try {
      const subscriptionId = await getOneSignalUserId();

      if (!subscriptionId) {
        setTestResult('❌ 購読IDが取得できません。通知許可と購読を確認してください。');
        return;
      }

      console.log('取得した購読ID:', subscriptionId);
      const sendAfterISO = new Date(Date.now() + 60 * 1000).toISOString();
      
      await schedulePushNotification({
        subscriptionId,
        title: '予約通知テスト',
        message: 'これは1分後に届くテスト通知です',
        sendAfterISO,
      });
      setTestResult('✅ 1分後に通知が届く予定です（バックグラウンド可）');
    } catch (error) {
      console.error('予約通知エラー:', error);
      setTestResult(`❌ 予約通知エラー: ${error.message}`);
    }
  };

  if (!isVisible) {
    return (
      <button 
        className="debug-toggle-btn"
        onClick={() => setIsVisible(true)}
      >
        🐛 デバッグ
      </button>
    );
  }

  return (
    <div className="onesignal-debug">
      <div className="debug-header">
        <h3>🐛 OneSignal デバッグ情報</h3>
        <button 
          className="debug-close-btn"
          onClick={() => setIsVisible(false)}
        >
          ✕
        </button>
      </div>

      <div className="debug-content">
        <div className="debug-section">
          <h4>📊 初期化状態</h4>
          {debugInfo ? (
            <div className="debug-info">
              <div className={`status ${debugInfo.initialized ? 'success' : 'error'}`}>
                {debugInfo.initialized ? '✅ 初期化済み' : '❌ 未初期化'}
              </div>
              {debugInfo.permission && (
                <div>通知許可: {debugInfo.permission ? '✅ 許可済み' : '❌ 未許可'}</div>
              )}
              {debugInfo.userId && (
                <div>ユーザーID: {debugInfo.userId}</div>
              )}
              {debugInfo.error && (
                <div className="error">エラー: {debugInfo.error}</div>
              )}
              <div className="timestamp">更新: {debugInfo.timestamp}</div>
            </div>
          ) : (
            <div>デバッグ情報を読み込み中...</div>
          )}
        </div>

        <div className="debug-section">
          <h4>🧪 テスト機能</h4>
          <div className="debug-buttons">
            <button onClick={handleRequestPermission}>
              🔔 通知許可をリクエスト
            </button>
            <button onClick={handleTestNotification}>
              📱 テスト通知送信
            </button>
            <button onClick={handleGetUserId}>
              🆔 ユーザーID取得
            </button>
            <button onClick={handleScheduleIn1min}>
              ⏱️ 1分後に予約通知（OneSignal REST）
            </button>
          </div>
          {testResult && (
            <div className="test-result">
              {testResult}
            </div>
          )}
        </div>

        <div className="debug-section">
          <h4>🌐 環境情報</h4>
          <div className="env-info">
            <div>プロトコル: {window.location.protocol}</div>
            <div>ホスト: {window.location.hostname}</div>
            <div>セキュア環境: {window.isSecureContext ? '✅' : '❌'}</div>
            <div>Notification API: {'Notification' in window ? '✅' : '❌'}</div>
            <div>Service Worker: {'serviceWorker' in navigator ? '✅' : '❌'}</div>
          </div>
        </div>

        <div className="debug-section">
          <h4>📝 コンソールログ</h4>
          <div className="console-note">
            詳細なログは開発者ツールのコンソールタブで確認してください。
            <br />
            F12キー → Consoleタブ
          </div>
        </div>
      </div>
    </div>
  );
}

export default OneSignalDebug;
