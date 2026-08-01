/* Sistem günlükleri sayfasının API erişim katmanı. DOM erişimi içermez. */
(function () {
    function unwrap(payload) {
        if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
            if (!payload.success) throw new Error(payload.error || 'API error');
            return payload.data;
        }
        return payload;
    }

    window.SystemLogsEndpoint = {
        async getDashboardStats() {
            return unwrap(await apiClient.get('/systemlogs/dashboard'));
        },
        async list(params) {
            return unwrap(await apiClient.get(`/systemlogs?${params.toString()}`));
        },
        async getDevices() {
            return unwrap(await apiClient.get('/Listing'));
        },
        async getUsers() {
            return unwrap(await apiClient.get('/Users'));
        },
        async getCommands() {
            return unwrap(await apiClient.get('/Commands'));
        },
        async archive() {
            return unwrap(await apiClient.post('/systemlogs/archive'));
        },
        async createCriticalTestLog() {
            return unwrap(await apiClient.post('/systemlogs/test-critical'));
        }
    };
}());
