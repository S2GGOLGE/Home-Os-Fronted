/* Cihaz API erişimi; DOM bağımlılığı yoktur. */
window.CihazlarEndpoint = {
    request(url, options) {
        return fetch(url, options);
    }
};