// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const { title, body, icon, badge, tag, image } = payload.notification || {};
  const { actionUrl, notificationId, type } = payload.data || {};

  const notificationOptions = {
    body: body || payload.data?.message || 'Yeni bildirim',
    icon: icon || '/icon-192x192.png',
    badge: badge || '/badge-72x72.png',
    tag: tag || type || 'default',
    image: image,
    data: {
      url: actionUrl || '/',
      notificationId: notificationId,
      type: type,
      ...payload.data
    },
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ],
    requireInteraction: payload.data?.priority === 'urgent',
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  return self.registration.showNotification(
    title || payload.data?.title || 'TourTrip',
    notificationOptions
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const { url, notificationId, action } = event.notification.data || {};

  if (action === 'close') {
    return;
  }

  const urlToOpen = url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if the app is already open
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              notificationId: notificationId
            });
            return;
          }
        }

        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );

  // Mark notification as read
  if (notificationId) {
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId })
    }).catch(err => console.error('Failed to mark notification as read:', err));
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.data);
});

// Handle push event (for future custom handling)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload:', payload);
    
    // Custom handling for specific notification types
    if (payload.data?.type === 'urgent') {
      // Handle urgent notifications differently
      event.waitUntil(
        self.registration.showNotification(payload.notification.title, {
          ...payload.notification,
          requireInteraction: true,
          silent: false,
          vibrate: [300, 200, 300, 200, 300],
          actions: [
            { action: 'open', title: 'Acil Aç', icon: '/icon-192x192.png' },
            { action: 'later', title: 'Sonra', icon: '/icon-192x192.png' }
          ]
        })
      );
    }
  } catch (error) {
    console.error('Error parsing push payload:', error);
  }
});

// Handle installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Handle activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
