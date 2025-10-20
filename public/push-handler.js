self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'KnowledgeVerse';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/static/icons/icon-192.png',
    badge: '/static/icons/icon-192.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});