import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import './NotificationPermission.css';

const NotificationPermission = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // テスト通知を送信
        new Notification('スケジュール管理アプリ', {
          body: '通知が有効になりました！',
          icon: '/logo192.png'
        });
      }
    } catch (error) {
      console.error('通知許可の要求に失敗しました:', error);
    }
  };

  const disableNotifications = () => {
    setPermission('denied');
  };

  if (!isSupported) {
    return null;
  }

  if (permission === 'granted') {
    return (
      <div className="notification-status granted">
        <Bell size={16} />
        <span>通知が有効です</span>
        <button onClick={disableNotifications} className="disable-btn">
          <BellOff size={14} />
        </button>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="notification-status denied">
        <BellOff size={16} />
        <span>通知が無効です</span>
        <button onClick={requestPermission} className="enable-btn">
          有効にする
        </button>
      </div>
    );
  }

  return (
    <div className="notification-permission">
      <div className="notification-content">
        <Bell size={20} />
        <div className="notification-text">
          <h3>通知を有効にしますか？</h3>
          <p>スケジュールのリマインダーを受け取ることができます</p>
        </div>
      </div>
      <div className="notification-actions">
        <button onClick={requestPermission} className="allow-btn">
          許可する
        </button>
        <button onClick={disableNotifications} className="deny-btn">
          後で
        </button>
      </div>
    </div>
  );
};

export default NotificationPermission;
