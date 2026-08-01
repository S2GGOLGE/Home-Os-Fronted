/* Sensörler sayfasının API erişim katmanı. DOM erişimi içermez. */
window.SensorsEndpoint = {
    async list() {
        return apiClient.get('/Sensors');
    },

    async create(sensor) {
        return apiClient.post('/Sensors', sensor);
    }
};
