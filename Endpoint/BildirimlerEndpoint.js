/* Bildirim API erişimi; DOM bağımlılığı yoktur. */
window.BildirimlerEndpoint = { request: (url, options) => fetch(url, options) };
