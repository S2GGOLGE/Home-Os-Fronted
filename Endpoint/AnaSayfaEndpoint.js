/* Ana sayfa API erişimi; DOM bağımlılığı yoktur. */
window.AnaSayfaEndpoint = { request: (url, options) => fetch(url, options) };
