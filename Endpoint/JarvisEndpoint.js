/* Jarvis API erişimi; DOM bağımlılığı yoktur. */
window.JarvisEndpoint = { request: (url, options) => fetch(url, options) };
