import { useEffect, useRef, useState } from 'react'

export function useNotification() {
  const [permission, setPermission] = useState(Notification.permission)
  const [isEnabled, setIsEnabled] = useState(false)
  const timersRef = useRef(new Map())

  // 通知許可を要求
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('このブラウザは通知をサポートしていません')
      return false
    }

    if (permission === 'granted') return true

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  // 通知を送信（Service Worker経由）
  const sendNotification = (title, options = {}) => {
    console.log('sendNotification called:', { title, options, permission, isEnabled })
    
    if (permission !== 'granted' || !isEnabled) {
      console.log('Notification not sent: permission or enabled check failed')
      return
    }

    // Service Workerが利用可能な場合はそちらを使用
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('Sending notification via Service Worker')
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title,
        options: {
          icon: './favicon.ico',
          badge: './favicon.ico',
          requireInteraction: true,
          ...options
        },
        delay: 0
      })
    } else {
      console.log('Sending notification via direct API')
      // フォールバック: 通常の通知
      const notification = new Notification(title, {
        icon: './favicon.ico',
        badge: './favicon.ico',
        requireInteraction: true,
        ...options
      })

      // 通知をクリックしたらフォーカス
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // 10秒後に自動で閉じる（長めに設定）
      setTimeout(() => notification.close(), 10000)
    }
  }

  // 予定の通知を設定
  const scheduleNotification = (year, month, day, startTime, content) => {
    if (!isEnabled) {
      console.log('通知が無効です')
      return
    }

    const now = new Date()
    const targetDate = new Date(year, month, day)
    const [hours, minutes] = startTime.split(':').map(Number)
    targetDate.setHours(hours, minutes, 0, 0)

    console.log('通知設定:', { year, month, day, startTime, content, targetDate, now })

    // 過去の予定は通知しない
    if (targetDate <= now) {
      console.log('過去の予定のため通知をスキップ')
      return
    }

    const notificationId = `${year}-${month}-${day}-${startTime}-${content}`

    // 既存のタイマーをクリア
    if (timersRef.current.has(notificationId)) {
      clearTimeout(timersRef.current.get(notificationId))
    }

    // 5分前の通知（1分後にテスト用）
    const fiveMinutesBefore = new Date(targetDate.getTime() - 5 * 60 * 1000)
    const testTime = new Date(now.getTime() + 1 * 60 * 1000) // 1分後にテスト
    
    console.log('通知タイマー設定:', { fiveMinutesBefore, testTime })

    // テスト用: 30秒後に通知（デバッグ用）
    const testTimer = setTimeout(() => {
      console.log('テスト通知を送信')
      sendNotification('🔔 通知テスト', {
        body: `${content} (${startTime}) - 通知機能が正常に動作しています`,
        tag: `test-${notificationId}`,
        data: { type: 'test', content, startTime }
      })
    }, 30 * 1000) // 30秒後
    timersRef.current.set(`${notificationId}-test`, testTimer)

    // 5分前の通知
    if (fiveMinutesBefore > now) {
      const timer1 = setTimeout(() => {
        console.log('5分前通知を送信')
        sendNotification(
          '予定の5分前です',
          {
            body: `${content} (${startTime})`,
            tag: `reminder-${notificationId}`
          }
        )
      }, fiveMinutesBefore.getTime() - now.getTime())
      timersRef.current.set(`${notificationId}-5min`, timer1)
    }

    // 予定時間の通知
    const timer2 = setTimeout(() => {
      console.log('予定時間通知を送信')
      sendNotification(
        '予定の時間です',
        {
          body: `${content} (${startTime})`,
          tag: `start-${notificationId}`
        }
      )
    }, targetDate.getTime() - now.getTime())
    timersRef.current.set(`${notificationId}-start`, timer2)
  }

  // 通知をキャンセル
  const cancelNotification = (year, month, day, startTime, content) => {
    const notificationId = `${year}-${month}-${day}-${startTime}-${content}`
    
    // 5分前のタイマーをクリア
    const timer1 = timersRef.current.get(`${notificationId}-5min`)
    if (timer1) {
      clearTimeout(timer1)
      timersRef.current.delete(`${notificationId}-5min`)
    }

    // 予定時間のタイマーをクリア
    const timer2 = timersRef.current.get(`${notificationId}-start`)
    if (timer2) {
      clearTimeout(timer2)
      timersRef.current.delete(`${notificationId}-start`)
    }
  }

  // 全ての通知をクリア
  const clearAllNotifications = () => {
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()
  }

  // コンポーネントアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      clearAllNotifications()
    }
  }, [])

  return {
    permission,
    isEnabled,
    setIsEnabled,
    requestPermission,
    sendNotification,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications
  }
}
