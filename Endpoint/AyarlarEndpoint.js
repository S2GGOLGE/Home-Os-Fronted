/* Ayarlar API erişimi; DOM bağımlılığı yoktur. */
window.AyarlarEndpoint = { request: (url, options) => fetch(url, options) };
