/* =====================================================
   Components/modal.js - Modal Bileşeni
   HomeOS için modal pencere yönetimi
   ===================================================== */

/**
 * Modal Yöneticisi
 * Modal pencerelerini açar, kapatır ve yönetir
 */
console.log("Modal js");
class ModalManager {
    constructor() {
        this.modalSelector = '.modal, .modal-overlay, .modal-backdrop';
        this.openModalSelector = '.modal.show, .modal.active, .modal-overlay.show, .modal-overlay.active, .modal-backdrop.show, .modal-backdrop.active';
        this.activeModals = new Set();
        
        this.initEventListeners();
    }

    /**
     * Event listener'ları başlatır
     */
    initEventListeners() {
        // Modal açma butonları
        document.addEventListener('click', (event) => {
            const openButton = event.target.closest('[data-modal-open]');
            if (openButton) {
                this.open(openButton.dataset.modalOpen);
                return;
            }

            // Modal kapatma butonları
            const closeButton = event.target.closest('[data-modal-close]');
            if (closeButton) {
                const modal = closeButton.closest(this.modalSelector);
                this.closeElement(modal);
                return;
            }

            // Modal dışına tıklama
            const modal = event.target.closest(this.modalSelector);
            if (modal && event.target === modal) {
                this.closeElement(modal);
            }
        });

        // ESC tuşu ile kapatma
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            
            document.querySelectorAll(this.openModalSelector).forEach(modal => {
                this.closeElement(modal);
            });
        });
    }

    /**
     * Modal elementini bulur
     * @param {string} modalId - Modal ID
     * @returns {HTMLElement|null} Modal elementi
     */
    getModal(modalId) {
        return document.getElementById(modalId);
    }

    /**
     * Modal açar
     * @param {string} modalId - Modal ID
     * @returns {boolean} Başarılı mı
     */
    open(modalId) {
        const modal = this.getModal(modalId);
        if (!modal) {
            console.error(`[Modal] Modal bulunamadı: ${modalId}`);
            return false;
        }

        modal.classList.add('show', 'active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        this.activeModals.add(modal);
        modal.dispatchEvent(new CustomEvent('modal:open', { detail: { modalId } }));
        
        console.log(`[Modal] Modal açıldı: ${modalId}`);
        return true;
    }

    /**
     * Modal kapatır
     * @param {HTMLElement} modal - Modal elementi
     */
    closeElement(modal) {
        if (!modal) return;

        modal.classList.remove('show', 'active');
        modal.setAttribute('aria-hidden', 'true');
        
        this.activeModals.delete(modal);
        
        // Başka açık modal varsa body overflow'ı koru
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }

        // Formları sıfırla
        modal.querySelectorAll('form').forEach(form => form.reset());
        
        modal.dispatchEvent(new CustomEvent('modal:close', { detail: { modal } }));
        
        console.log('[Modal] Modal kapatıldı');
    }

    /**
     * ID ile modal kapatır
     * @param {string} modalId - Modal ID
     * @returns {boolean} Başarılı mı
     */
    close(modalId) {
        const modal = this.getModal(modalId);
        if (!modal) {
            console.error(`[Modal] Modal bulunamadı: ${modalId}`);
            return false;
        }
        
        this.closeElement(modal);
        return true;
    }

    /**
     * Tüm modalları kapatır
     */
    closeAll() {
        document.querySelectorAll(this.openModalSelector).forEach(modal => {
            this.closeElement(modal);
        });
    }

    /**
     * Modal açık mı kontrol eder
     * @param {string} modalId - Modal ID
     * @returns {boolean} Açık mı
     */
    isOpen(modalId) {
        const modal = this.getModal(modalId);
        return modal ? modal.classList.contains('show') || modal.classList.contains('active') : false;
    }

    /**
     * Dinamik modal oluşturur
     * @param {object} options - Modal seçenekleri
     * @param {string} options.title - Modal başlığı
     * @param {string} options.content - Modal içeriği
     * @param {string} options.footer - Modal footer içeriği
     * @param {string} options.size - Modal boyutu ('sm', 'md', 'lg', 'xl')
     * @param {boolean} options.closeOnBackdrop - Backdrop'a tıklayınca kapatılsın mı
     * @returns {string} Oluşturulan modal ID
     */
    create(options = {}) {
        const {
            title = 'Modal',
            content = '',
            footer = '',
            size = 'md',
            closeOnBackdrop = true
        } = options;

        const modalId = `dynamic-modal-${Date.now()}`;
        
        const modalHtml = `
            <div id="${modalId}" class="modal-overlay" aria-hidden="true" data-modal-close-on-backdrop="${closeOnBackdrop}">
                <div class="modal-window modal-${size}">
                    <div class="modal-header">
                        <h2>${escapeHtml(title)}</h2>
                        <button type="button" class="close-btn" data-modal-close aria-label="Kapat">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        return modalId;
    }

    /**
     * Dinamik modalı kaldırır
     * @param {string} modalId - Modal ID
     */
    destroy(modalId) {
        const modal = this.getModal(modalId);
        if (modal) {
            modal.remove();
            console.log(`[Modal] Modal kaldırıldı: ${modalId}`);
        }
    }

    /**
     * Confirm dialog gösterir
     * @param {object} options - Dialog seçenekleri
     * @param {string} options.title - Başlık
     * @param {string} options.message - Mesaj
     * @param {string} options.confirmText - Onay butonu metni
     * @param {string} options.cancelText - İptal butonu metni
     * @returns {Promise} Kullanıcı seçimi
     */
    confirm(options = {}) {
        const {
            title = 'Onay',
            message = 'Emin misiniz?',
            confirmText = 'Evet',
            cancelText = 'İptal'
        } = options;

        return new Promise((resolve) => {
            const footer = `
                <button type="button" class="btn-secondary" data-modal-close>${escapeHtml(cancelText)}</button>
                <button type="button" class="btn-primary btn-confirm">${escapeHtml(confirmText)}</button>
            `;

            const modalId = this.create({
                title,
                content: `<p>${escapeHtml(message)}</p>`,
                footer,
                size: 'sm'
            });

            const modal = this.getModal(modalId);
            const confirmBtn = modal.querySelector('.btn-confirm');

            confirmBtn.addEventListener('click', () => {
                this.close(modalId);
                setTimeout(() => {
                    this.destroy(modalId);
                    resolve(true);
                }, 300);
            });

            modal.addEventListener('modal:close', () => {
                setTimeout(() => {
                    this.destroy(modalId);
                    resolve(false);
                }, 300);
            }, { once: true });

            this.open(modalId);
        });
    }

    /**
     * Alert dialog gösterir
     * @param {object} options - Dialog seçenekleri
     * @param {string} options.title - Başlık
     * @param {string} options.message - Mesaj
     * @param {string} options.buttonText - Buton metni
     * @returns {Promise} Kapatıldığında resolve
     */
    alert(options = {}) {
        const {
            title = 'Bilgi',
            message = '',
            buttonText = 'Tamam'
        } = options;

        return new Promise((resolve) => {
            const footer = `
                <button type="button" class="btn-primary" data-modal-close>${escapeHtml(buttonText)}</button>
            `;

            const modalId = this.create({
                title,
                content: `<p>${escapeHtml(message)}</p>`,
                footer,
                size: 'sm'
            });

            const modal = this.getModal(modalId);

            modal.addEventListener('modal:close', () => {
                setTimeout(() => {
                    this.destroy(modalId);
                    resolve();
                }, 300);
            }, { once: true });

            this.open(modalId);
        });
    }
}

// Global modal manager örneği
const modalManager = new ModalManager();

// Geriye uyumluluk için eski API
window.HomeOSModal = {
    open: (modalId) => modalManager.open(modalId),
    close: (modalId) => modalManager.close(modalId),
    closeElement: (modal) => modalManager.closeElement(modal),
    closeAll: () => modalManager.closeAll(),
    confirm: (options) => modalManager.confirm(options),
    alert: (options) => modalManager.alert(options)
};