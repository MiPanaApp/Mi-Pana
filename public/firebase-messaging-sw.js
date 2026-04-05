importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyAxUcuTe63vywz4K58d75lLa0V9HNLfUe4",
  authDomain:        "app-mi-pana.firebaseapp.com",
  projectId:         "app-mi-pana",
  storageBucket:     "app-mi-pana.firebasestorage.app",
  messagingSenderId: "637946158184",
  appId:             "1:637946158184:web:8335e10c518944ea416fdd"
});

const messaging = firebase.messaging();

// Manejar notificaciones cuando la app está en segundo plano
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification || {};
  
  self.registration.showNotification(title || 'Mi Pana', {
    body: body || '',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: data || {},
    vibrate: [200, 100, 200],
    tag: payload.collapseKey || 'mipana-notification',
    renotify: true,
    actions: data?.actionUrl ? [
      { action: 'open', title: 'Ver' }
    ] : []
  });
});

// Click en la notificación → abrir la app en la ruta correcta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.actionUrl || '/home';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(actionUrl);
          return;
        }
      }
      return clients.openWindow(actionUrl);
    })
  );
});
