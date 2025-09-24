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
    if (permission !== 'granted' || !isEnabled) return

    // Service Workerが利用可能な場合はそちらを使用
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title,
        options: {
          icon: './favicon.ico',
          badge: './favicon.ico',
          ...options
        },
        delay: 0
      })
    } else {
      // フォールバック: 通常の通知
      const notification = new Notification(title, {
        icon: './favicon.ico',
        badge: './favicon.ico',
        ...options
      })

      // 通知をクリックしたらフォーカス
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // 5秒後に自動で閉じる
      setTimeout(() => notification.close(), 5000)
    }
  }

  // 予定の通知を設定
  const scheduleNotification = (year, month, day, startTime, content) => {
    if (!isEnabled) return

    const now = new Date()
    const targetDate = new Date(year, month, day)
    const [hours, minutes] = startTime.split(':').map(Number)
    targetDate.setHours(hours, minutes, 0, 0)

    // 過去の予定は通知しない
    if (targetDate <= now) return

    const notificationId = `${year}-${month}-${day}-${startTime}-${content}`

    // 既存のタイマーをクリア
    if (timersRef.current.has(notificationId)) {
      clearTimeout(timersRef.current.get(notificationId))
    }

    // Service Workerが利用可能な場合はバックグラウンド通知を使用
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // 5分前の通知
      const fiveMinutesBefore = new Date(targetDate.getTime() - 5 * 60 * 1000)
      if (fiveMinutesBefore > now) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          title: '予定の5分前です',
          options: {
            body: `${content} (${startTime})`,
            tag: `reminder-${notificationId}`,
            requireInteraction: true
          },
          delay: fiveMinutesBefore.getTime() - now.getTime()
        })
      }

      // 予定時間の通知
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title: '予定の時間です',
        options: {
          body: `${content} (${startTime})`,
          tag: `start-${notificationId}`,
          requireInteraction: true
        },
        delay: targetDate.getTime() - now.getTime()
      })
    } else {
      // フォールバック: 通常のタイマー通知
      // 5分前の通知
      const fiveMinutesBefore = new Date(targetDate.getTime() - 5 * 60 * 1000)
      if (fiveMinutesBefore > now) {
        const timer1 = setTimeout(() => {
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
