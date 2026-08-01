/* Kamera API erişimi; DOM bağımlılığı yoktur. */
window.KameralarEndpoint = { request: (url, options) => fetch(url, options) };
