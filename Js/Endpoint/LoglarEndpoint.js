/* Uygulama logları API erişimi; DOM bağımlılığı yoktur. */
window.LoglarEndpoint = { request: (url, options) => fetch(url, options) };
