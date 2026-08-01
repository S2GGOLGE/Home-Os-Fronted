/* Oda API erişimi; DOM bağımlılığı yoktur. */
window.OdalarEndpoint = { request: (url, options) => fetch(url, options) };
