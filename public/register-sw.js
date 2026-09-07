if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Forex PWA ServiceWorker registered:', reg.scope);
      })
      .catch(err => {
        console.log('Forex PWA ServiceWorker registration failed:', err);
      });
  });
}
