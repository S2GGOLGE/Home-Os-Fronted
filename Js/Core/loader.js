/* =====================================================
   Core/loader.js - Loader Yönetimi
   HomeOS için sayfa yükleme animasyonları
   ===================================================== */

/**
 * Loader sınıfı
 * Sayfa yükleme animasyonlarını yönetir
 */
class Loader {
    constructor() {
        this.overlay = null;
        this.bar = null;
        this.text = null;
        this.percentage = null;
        this.isVisible = false;
    }

    /**
     * Loader elementlerini başlatır
     */
    init() {
        this.overlay = document.getElementById('loader-overlay');
        this.bar = document.getElementById('loader-bar');
        this.text = document.getElementById('loader-text');
        this.percentage = document.getElementById('loader-percentage');
    }

    /**
     * Loader'ı gösterir
     * @param {string} initialText - Başlangıç metni
     */
    show(initialText = 'Yükleniyor...') {
        if (!this.overlay) {
            this.init();
        }

        if (this.overlay) {
            this.overlay.classList.remove('hidden');
            this.isVisible = true;
            this.updateProgress(0, initialText);
        }
    }

    /**
     * Loader'ı gizler
     */
    hide() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            this.isVisible = false;
        }
    }

    /**
     * İlerleme durumunu günceller
     * @param {number} percentage - Yüzde (0-100)
     * @param {string} text - Durum metni
     */
    updateProgress(percentage, text) {
        if (this.bar) {
            this.bar.style.width = `${percentage}%`;
        }
        
        if (this.percentage) {
            this.percentage.textContent = `${percentage}%`;
        }
        
        if (this.text) {
            this.text.textContent = text;
        }
    }

    /**
     * Loader'ın görünürlüğünü kontrol eder
     * @returns {boolean} Görünür mü
     */
    isLoaderVisible() {
        return this.isVisible;
    }

    /**
     * Simüle edilmiş yükleme animasyonu
     * @param {object} options - Animasyon seçenekleri
     * @param {number} options.duration - Toplam süre (ms)
     * @param {string} options.startText - Başlangıç metni
     * @param {string} options.endText - Bitiş metni
     * @param {function} options.onComplete - Tamamlandığında çağrılacak fonksiyon
     */
    simulateLoading(options = {}) {
        const {
            duration = 2000,
            startText = 'Yükleniyor...',
            endText = 'Tamamlandı',
            onComplete = null
        } = options;

        this.show(startText);
        
        let progress = 0;
        const interval = 50;
        const increment = 100 / (duration / interval);
        
        const timer = setInterval(() => {
            progress += increment;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
                this.updateProgress(100, endText);
                
                setTimeout(() => {
                    this.hide();
                    if (onComplete) onComplete();
                }, 500);
            } else {
                this.updateProgress(Math.floor(progress), startText);
            }
        }, interval);
    }
}

// Global loader örneği
const loader = new Loader();