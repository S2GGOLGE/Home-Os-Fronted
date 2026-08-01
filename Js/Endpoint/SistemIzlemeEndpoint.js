/* Sistem izleme sayfasının API erişim katmanı. DOM erişimi içermez. */
window.SystemMonitoringEndpoint = {
    async getMetrics() {
        return apiClient.get('/SystemMonitoring');
    }
};
