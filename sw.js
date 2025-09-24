// Service Worker for background notifications
const CACHE_NAME = 'schedule-manager-v1'

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  // すぐに新しいSWを有効にして、古いSWを置き換える
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(self.clients.claim())
})

// Background notification handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delay } = event.data
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        ...options,
        requireInteraction: true, // ユーザーが操作するまで表示
        actions: [
          {
            action: 'view',
            title: '確認'
          },
          {
            action: 'dismiss',
            title: '閉じる'
          }
        ]
      })
    }, delay)
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view') {
    // アプリを開く
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin)
        }
      })
    )
  }
})

// Background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    console.log('Background sync for notifications')
  }
})
