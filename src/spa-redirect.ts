// Restore deep-link path after GitHub Pages 404.html bounce to /
const key = "ghpages:spa-redirect"
const path = sessionStorage.getItem(key)
if (path) {
  sessionStorage.removeItem(key)
  if (path !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, "", path)
  }
}
