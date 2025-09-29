import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import './NotificationPermission.css';

const NotificationPermission = () => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      if ('Notification' in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      } else {
        setIsSupported(false);
        setPermission('denied');
      }
    };
    
    checkSupport();
  }, []);

  const requestPermission = async () => {
    if (!isSupported || !('Notification' in window) || !(window.isSecureContext || window.location.hostname === 'localhost')) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // テスト通知を送信
        try {
          new Notification('スケジュール管理アプリ', {
            body: '通知が有効になりました！',
            icon: '/logo192.png'
          });
        } catch (notificationError) {
          console.log('通知の送信に失敗しました:', notificationError);
        }
      }
    } catch (error) {
      console.error('通知許可の要求に失敗しました:', error);
    }
  };

  const disableNotifications = () => {
    setPermission('denied');
  };

  const isSecure = (typeof window !== 'undefined') && (window.isSecureContext || window.location.hostname === 'localhost');

  if (!isSupported) {
    return (
      <div className="notification-status denied">
        <BellOff size={16} />
        <span>通知はサポートされていません</span>
      </div>
    );
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

  if (!isSecure) {
    return (
      <div className="notification-status denied">
        <BellOff size={16} />
        <span>通知はHTTPSまたはlocalhostでのみ有効です</span>
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
