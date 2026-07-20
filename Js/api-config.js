// Backend: Y:/Home Asistan/Backend/Apı/Apı
// Public sunucuda yayınlarken localhost yerine backend'in public /api adresini yazın.

if (window.AndroidInterface && typeof window.AndroidInterface.getApiUrl === 'function') {
    window.HOMEOS_API_BASE_URL = window.AndroidInterface.getApiUrl();
} else {
    window.HOMEOS_API_BASE_URL =
        window.HOMEOS_API_BASE_URL || "https://localhost:7201/api";
}