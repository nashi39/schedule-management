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
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delay } = event.data
    
    console.log('Scheduling notification:', { title, options, delay })
    
    setTimeout(() => {
      console.log('Showing notification:', title)
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
      }).then(() => {
        console.log('Notification shown successfully')
      }).catch(err => {
        console.error('Failed to show notification:', err)
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
