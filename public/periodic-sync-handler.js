self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'get-daily-update') {
    event.waitUntil(
      fetch('/api/knowledge/daily-update')
        .then((response) => response.json())
        .then((data) => {
          console.log('Periodic sync successful:', data);
        })
        .catch((err) => {
          console.error('Periodic sync failed:', err);
        })
    );
  }
});