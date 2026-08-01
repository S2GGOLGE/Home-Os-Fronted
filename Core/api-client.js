/* =====================================================
   Core/api-client.js - API İstemci Sınıfı
   HomeOS için HTTP istemci yönetimi
   ===================================================== */

/**
 * API İstemci Sınıfı
 * Tüm API çağrıları için merkezi yönetim
 */
class ApiClient {
    constructor() {
        this.baseURL = getApiBaseUrl();
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Authorization header'ını hazırlar
     * @returns {object} Headers objesi
     */
    getAuthHeaders() {
        const token = getAuthToken();
        const headers = new Headers(this.defaultHeaders);
        
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        
        return headers;
    }

    /**
     * GET isteği yapar
     * @param {string} endpoint - API endpoint
     * @param {object} options - İstek seçenekleri
     * @returns {Promise} Response
     */
    async get(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers,
                ...options
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw this.handleError(error, 'GET', endpoint);
        }
    }

    /**
     * POST isteği yapar
     * @param {string} endpoint - API endpoint
     * @param {object} data - Gönderilecek veri
     * @param {object} options - İstek seçenekleri
     * @returns {Promise} Response
     */
    async post(endpoint, data = {}, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                ...options
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw this.handleError(error, 'POST', endpoint);
        }
    }

    /**
     * PUT isteği yapar
     * @param {string} endpoint - API endpoint
     * @param {object} data - Gönderilecek veri
     * @param {object} options - İstek seçenekleri
     * @returns {Promise} Response
     */
    async put(endpoint, data = {}, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
                ...options
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw this.handleError(error, 'PUT', endpoint);
        }
    }

    /**
     * DELETE isteği yapar
     * @param {string} endpoint - API endpoint
     * @param {object} options - İstek seçenekleri
     * @returns {Promise} Response
     */
    async delete(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers,
                ...options
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw this.handleError(error, 'DELETE', endpoint);
        }
    }

    /**
     * API yanıtını işler
     * @param {Response} response - Fetch response objesi
     * @returns {Promise} İşlenmiş veri
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'İstek başarısız'}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    }

    /**
     * Hata işler
     * @param {Error} error - Hata objesi
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @returns {Error} İşlenmiş hata
     */
    handleError(error, method, endpoint) {
        console.error(`[API Client] ${method} ${endpoint} hatası:`, error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return new Error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
        }
        
        return error;
    }

    /**
     * Base URL'ini günceller
     * @param {string} url - Yeni base URL
     */
    setBaseURL(url) {
        this.baseURL = url;
    }
}

// Global API client örneği
const apiClient = new ApiClient();