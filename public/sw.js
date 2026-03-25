// DailyDev Service Worker
// Purpose: PWA install + Firebase Cloud Messaging push notifications

importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCx2qeIcbv9GkNXoWTieRN0EsTU1ItVbsU',
  authDomain: 'daily-dev-82578.firebaseapp.com',
  projectId: 'daily-dev-82578',
  storageBucket: 'daily-dev-82578.firebasestorage.app',
  messagingSenderId: '6918983549',
  appId: '1:6918983549:web:8fa2d77af32a235b4f4614',
})

const messaging = firebase.messaging()

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'DailyDev'
  const options = {
    body: payload.notification?.body ?? '',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    data: { url: payload.data?.url ?? '/' },
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
