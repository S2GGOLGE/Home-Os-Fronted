/* =====================================================
   Components/toast.js - Toast Bildirim Bileşeni
   HomeOS için toast bildirim yönetimi
   ===================================================== */

/**
 * Toast Yöneticisi
 * Toast bildirimlerini gösterir ve yönetir
 */
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultDuration = 5000;
        this.maxToasts = 5;
        this.toastTypes = {
            success: {
                icon: 'fas fa-check-circle',
                class: 'toast-success'
            },
            error: {
                icon: 'fas fa-exclamation-circle',
                class: 'toast-error'
            },
            warning: {
                icon: 'fas fa-exclamation-triangle',
                class: 'toast-warning'
            },
            info: {
                icon: 'fas fa-info-circle',
                class: 'toast-info'
            }
        };
        
        this.initContainer();
        this.initStyles();
    }

    /**
     * Toast container'ını başlatır
     */
    initContainer() {
        this.container = document.getElementById('toast-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Toast stillerini başlatır
     */
    initStyles() {
        if (document.getElementById('toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }

            .toast {
                pointer-events: auto;
                min-width: 300px;
                max-width: 400px;
                background: var(--bg-panel);
                border: 1px solid var(--border-line);
                border-radius: 10px;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                animation: toastSlideIn 0.3s ease;
                transition: all 0.3s ease;
            }

            .toast.removing {
                animation: toastSlideOut 0.3s ease forwards;
            }

            .toast-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .toast-content {
                flex: 1;
                min-width: 0;
            }

            .toast-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
                color: var(--text-primary);
            }

            .toast-message {
                font-size: 13px;
                color: var(--text-secondary);
                word-break: break-word;
            }

            .toast-close {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 16px;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background: var(--bg-inner);
                color: var(--text-primary);
            }

            .toast-success .toast-icon { color: var(--accent-green); }
            .toast-success { border-left: 4px solid var(--accent-green); }

            .toast-error .toast-icon { color: var(--color-error); }
            .toast-error { border-left: 4px solid var(--color-error); }

            .toast-warning .toast-icon { color: var(--color-warn); }
            .toast-warning { border-left: 4px solid var(--color-warn); }

            .toast-info .toast-icon { color: var(--color-info); }
            .toast-info { border-left: 4px solid var(--color-info); }

            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes toastSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }

            @media (max-width: 480px) {
                .toast-container {
                    right: 10px;
                    left: 10px;
                }

                .toast {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Toast gösterir
     * @param {object} options - Toast seçenekleri
     * @param {string} options.type - Toast tipi ('success', 'error', 'warning', 'info')
     * @param {string} options.title - Başlık
     * @param {string} options.message - Mesaj
     * @param {number} options.duration - Süre (ms)
     * @param {boolean} options.closeable - Kapatılabilir mi
     * @returns {string} Toast ID
     */
    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.defaultDuration,
            closeable = true
        } = options;

        const toastId = `toast-${Date.now()}`;
        const toastConfig = this.toastTypes[type] || this.toastTypes.info;

        // Maksimum toast sayısı kontrolü
        if (this.toasts.size >= this.maxToasts) {
            const oldestToast = this.toasts.keys().next().value;
            this.remove(oldestToast);
        }

        const toastHtml = `
            <div id="${toastId}" class="toast ${toastConfig.class}">
                <div class="toast-icon">
                    <i class="${toastConfig.icon}"></i>
                </div>
                <div class="toast-content">
                    ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
                    <div class="toast-message">${escapeHtml(message)}</div>
                </div>
                ${closeable ? `
                    <button class="toast-close" data-toast-close="${toastId}" aria-label="Kapat">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        
        this.toasts.set(toastId, {
            element: toastElement,
            timeout: null
        });

        // Kapatma butonu
        if (closeable) {
            const closeBtn = toastElement.querySelector('[data-toast-close]');
            closeBtn.addEventListener('click', () => this.remove(toastId));
        }

        // Otomatik kapatma
        if (duration > 0) {
            const timeout = setTimeout(() => this.remove(toastId), duration);
            this.toasts.get(toastId).timeout = timeout;
        }

        // Hover'da otomatik kapatmayı durdur
        toastElement.addEventListener('mouseenter', () => {
            const toastData = this.toasts.get(toastId);
            if (toastData && toastData.timeout) {
                clearTimeout(toastData.timeout);
            }
        });

        toastElement.addEventListener('mouseleave', () => {
            if (duration > 0) {
                const timeout = setTimeout(() => this.remove(toastId), duration);
                this.toasts.get(toastId).timeout = timeout;
            }
        });

        console.log(`[Toast] Toast gösterildi: ${toastId} (${type})`);
        return toastId;
    }

    /**
     * Toast kaldırır
     * @param {string} toastId - Toast ID
     */
    remove(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        if (toastData.timeout) {
            clearTimeout(toastData.timeout);
        }

        toastData.element.classList.add('removing');

        setTimeout(() => {
            if (toastData.element && toastData.element.parentNode) {
                toastData.element.remove();
            }
            this.toasts.delete(toastId);
            console.log(`[Toast] Toast kaldırıldı: ${toastId}`);
        }, 300);
    }

    /**
     * Tüm toasts'ları kaldırır
     */
    removeAll() {
        this.toasts.forEach((_, toastId) => {
            this.remove(toastId);
        });
    }

    /**
     * Success toast gösterir
     * @param {string} message - Mesaj
     * @param {string} title - Başlık
     * @param {number} duration - Süre
     * @returns {string} Toast ID
     */
    success(message, title = 'Başarılı', duration = this.defaultDuration) {
        return this.show({
            type: 'success',
            title,
            message,
            duration
        });
    }

    /**
     * Error toast gösterir
     * @param {string} message - Mesaj
     * @param {string} title - Başlık
     * @param {number} duration - Süre
     * @returns {string} Toast ID
     */
    error(message, title = 'Hata', duration = this.defaultDuration) {
        return this.show({
            type: 'error',
            title,
            message,
            duration
        });
    }

    /**
     * Warning toast gösterir
     * @param {string} message - Mesaj
     * @param {string} title - Başlık
     * @param {number} duration - Süre
     * @returns {string} Toast ID
     */
    warning(message, title = 'Uyarı', duration = this.defaultDuration) {
        return this.show({
            type: 'warning',
            title,
            message,
            duration
        });
    }

    /**
     * Info toast gösterir
     * @param {string} message - Mesaj
     * @param {string} title - Başlık
     * @param {number} duration - Süre
     * @returns {string} Toast ID
     */
    info(message, title = 'Bilgi', duration = this.defaultDuration) {
        return this.show({
            type: 'info',
            title,
            message,
            duration
        });
    }
}

// Global toast manager örneği
const toastManager = new ToastManager();

// Kısa kullanım için global fonksiyonlar
window.showToast = (options) => toastManager.show(options);
window.showSuccessToast = (message, title, duration) => toastManager.success(message, title, duration);
window.showErrorToast = (message, title, duration) => toastManager.error(message, title, duration);
window.showWarningToast = (message, title, duration) => toastManager.warning(message, title, duration);
window.showInfoToast = (message, title, duration) => toastManager.info(message, title, duration);