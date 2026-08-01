/* Kullanıcı API erişimi; DOM bağımlılığı yoktur. */
window.KullaniciEndpoint = { request: (url, options) => fetch(url, options) };
