// 앱 설치(PWA)를 위한 최소 서비스 워커.
// 캐시를 하지 않고 네트워크로 그대로 보내서, 배포하면 항상 최신 버전이 열린다.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
