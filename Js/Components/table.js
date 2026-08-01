/* =====================================================
   Components/table.js - Tablo Bileşeni
   HomeOS için tablo yönetimi
   ===================================================== */

/**
 * Tablo Yöneticisi
 * Tabloları oluşturur, yönetir ve günceller
 */
class TableManager {
    constructor() {
        this.tables = new Map();
        this.initStyles();
    }

    /**
     * Tablo stillerini başlatır
     */
    initStyles() {
        if (document.getElementById('table-styles')) return;

        const style = document.createElement('style');
        style.id = 'table-styles';
        style.textContent = `
            .homeos-table {
                width: 100%;
                border-collapse: collapse;
                background: var(--bg-panel);
                border-radius: 10px;
                overflow: hidden;
            }

            .homeos-table thead {
                background: var(--bg-inner);
            }

            .homeos-table th {
                padding: 12px 16px;
                text-align: left;
                font-weight: 600;
                font-size: 13px;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 1px solid var(--border-line);
            }

            .homeos-table th.sortable {
                cursor: pointer;
                user-select: none;
                transition: color 0.2s ease;
            }

            .homeos-table th.sortable:hover {
                color: var(--accent-green);
            }

            .homeos-table th.sortable .sort-icon {
                margin-left: 6px;
                opacity: 0.5;
            }

            .homeos-table th.sortable.asc .sort-icon::after {
                content: '▲';
            }

            .homeos-table th.sortable.desc .sort-icon::after {
                content: '▼';
            }

            .homeos-table td {
                padding: 12px 16px;
                border-bottom: 1px solid var(--border-line);
                font-size: 14px;
                color: var(--text-primary);
            }

            .homeos-table tbody tr {
                transition: background 0.2s ease;
            }

            .homeos-table tbody tr:hover {
                background: var(--bg-inner);
            }

            .homeos-table tbody tr:last-child td {
                border-bottom: none;
            }

            .homeos-table .table-actions {
                display: flex;
                gap: 8px;
            }

            .homeos-table .action-btn {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 6px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .homeos-table .action-btn:hover {
                background: var(--bg-panel);
                color: var(--accent-green);
            }

            .homeos-table .action-btn.delete:hover {
                color: var(--color-error);
            }

            .homeos-table .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--text-muted);
            }

            .homeos-table .empty-state i {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
            }

            .homeos-table .status-badge {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .homeos-table .status-badge.online {
                background: rgba(0, 255, 136, 0.15);
                color: var(--accent-green);
            }

            .homeos-table .status-badge.offline {
                background: rgba(255, 68, 68, 0.15);
                color: var(--color-error);
            }

            .homeos-table .pagination {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                background: var(--bg-inner);
                border-top: 1px solid var(--border-line);
            }

            .homeos-table .pagination-info {
                font-size: 13px;
                color: var(--text-secondary);
            }

            .homeos-table .pagination-controls {
                display: flex;
                gap: 8px;
            }

            .homeos-table .pagination-btn {
                background: var(--bg-panel);
                border: 1px solid var(--border-line);
                color: var(--text-primary);
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
            }

            .homeos-table .pagination-btn:hover:not(:disabled) {
                border-color: var(--accent-green);
                color: var(--accent-green);
            }

            .homeos-table .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .homeos-table .pagination-btn.active {
                background: var(--accent-green);
                color: #000;
                border-color: var(--accent-green);
            }

            @media (max-width: 768px) {
                .homeos-table {
                    font-size: 13px;
                }

                .homeos-table th,
                .homeos-table td {
                    padding: 10px 12px;
                }

                .homeos-table .pagination {
                    flex-direction: column;
                    gap: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Tablo oluşturur
     * @param {object} options - Tablo seçenekleri
     * @param {string} options.containerId - Container ID
     * @param {Array} options.columns - Sütunlar
     * @param {Array} options.data - Veri
     * @param {object} options.pagination - Sayfalama ayarları
     * @param {boolean} options.sortable - Sıralanabilir mi
     * @param {boolean} options.filterable - Filtrelenebilir mi
     * @returns {string} Tablo ID
     */
    create(options = {}) {
        const {
            containerId,
            columns = [],
            data = [],
            pagination = { enabled: false, pageSize: 10 },
            sortable = true,
            filterable = false
        } = options;

        const tableId = `table-${Date.now()}`;
        const container = document.getElementById(containerId);

        if (!container) {
            console.error(`[Table] Container bulunamadı: ${containerId}`);
            return null;
        }

        const tableHtml = this.generateTableHtml(tableId, columns, data, sortable);
        container.innerHTML = tableHtml;

        this.tables.set(tableId, {
            columns,
            data,
            pagination,
            sortable,
            filterable,
            currentPage: 1,
            sortColumn: null,
            sortDirection: 'asc',
            filters: {}
        });

        if (sortable) {
            this.initSorting(tableId);
        }

        if (pagination.enabled) {
            this.updatePagination(tableId);
        }

        console.log(`[Table] Tablo oluşturuldu: ${tableId}`);
        return tableId;
    }

    /**
     * Tablo HTML'ini oluşturur
     * @param {string} tableId - Tablo ID
     * @param {Array} columns - Sütunlar
     * @param {Array} data - Veri
     * @param {boolean} sortable - Sıralanabilir mi
     * @returns {string} HTML
     */
    generateTableHtml(tableId, columns, data, sortable) {
        const headerHtml = columns.map(col => `
            <th class="${sortable && col.sortable !== false ? 'sortable' : ''}" 
                data-column="${col.key}">
                ${escapeHtml(col.label)}
                ${sortable && col.sortable !== false ? '<span class="sort-icon"></span>' : ''}
            </th>
        `).join('');

        const bodyHtml = data.length > 0 
            ? data.map(row => this.generateRowHtml(row, columns)).join('')
            : `
                <tr>
                    <td colspan="${columns.length}" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Veri bulunamadı</p>
                    </td>
                </tr>
            `;

        return `
            <table id="${tableId}" class="homeos-table">
                <thead>
                    <tr>${headerHtml}</tr>
                </thead>
                <tbody>${bodyHtml}</tbody>
            </table>
            <div id="${tableId}-pagination" class="pagination" style="display: none;"></div>
        `;
    }

    /**
     * Satır HTML'ini oluşturur
     * @param {object} row - Satır verisi
     * @param {Array} columns - Sütunlar
     * @returns {string} HTML
     */
    generateRowHtml(row, columns) {
        return columns.map(col => {
            const value = row[col.key];
            const cellContent = col.render 
                ? col.render(value, row) 
                : escapeHtml(String(value ?? '-'));
            
            return `<td>${cellContent}</td>`;
        }).join('');
    }

    /**
     * Sıralamayı başlatır
     * @param {string} tableId - Tablo ID
     */
    initSorting(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const headers = table.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                this.sort(tableId, column);
            });
        });
    }

    /**
     * Tabloyu sıralar
     * @param {string} tableId - Tablo ID
     * @param {string} column - Sütun
     */
    sort(tableId, column) {
        const tableData = this.tables.get(tableId);
        if (!tableData) return;

        // Sıralama yönünü değiştir
        if (tableData.sortColumn === column) {
            tableData.sortDirection = tableData.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            tableData.sortColumn = column;
            tableData.sortDirection = 'asc';
        }

        // Veriyi sırala
        tableData.data.sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];

            if (aVal < bVal) return tableData.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return tableData.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Tabloyu güncelle
        this.updateTable(tableId);
        this.updateSortIndicators(tableId);
    }

    /**
     * Sıralama göstergelerini günceller
     * @param {string} tableId - Tablo ID
     */
    updateSortIndicators(tableId) {
        const table = document.getElementById(tableId);
        const tableData = this.tables.get(tableId);
        if (!table || !tableData) return;

        const headers = table.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.classList.remove('asc', 'desc');
            if (header.dataset.column === tableData.sortColumn) {
                header.classList.add(tableData.sortDirection);
            }
        });
    }

    /**
     * Tabloyu günceller
     * @param {string} tableId - Tablo ID
     */
    updateTable(tableId) {
        const table = document.getElementById(tableId);
        const tableData = this.tables.get(tableId);
        if (!table || !tableData) return;

        const tbody = table.querySelector('tbody');
        const displayData = tableData.pagination.enabled 
            ? this.getPaginatedData(tableId)
            : tableData.data;

        tbody.innerHTML = displayData.length > 0
            ? displayData.map(row => this.generateRowHtml(row, tableData.columns)).join('')
            : `
                <tr>
                    <td colspan="${tableData.columns.length}" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Veri bulunamadı</p>
                    </td>
                </tr>
            `;
    }

    /**
     * Sayfalı veriyi döndürür
     * @param {string} tableId - Tablo ID
     * @returns {Array} Sayfalı veri
     */
    getPaginatedData(tableId) {
        const tableData = this.tables.get(tableId);
        if (!tableData || !tableData.pagination.enabled) return [];

        const start = (tableData.currentPage - 1) * tableData.pagination.pageSize;
        const end = start + tableData.pagination.pageSize;

        return tableData.data.slice(start, end);
    }

    /**
     * Sayfalama günceller
     * @param {string} tableId - Tablo ID
     */
    updatePagination(tableId) {
        const tableData = this.tables.get(tableId);
        const paginationContainer = document.getElementById(`${tableId}-pagination`);
        
        if (!tableData || !tableData.pagination.enabled || !paginationContainer) return;

        const totalPages = Math.ceil(tableData.data.length / tableData.pagination.pageSize);
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        const startItem = (tableData.currentPage - 1) * tableData.pagination.pageSize + 1;
        const endItem = Math.min(tableData.currentPage * tableData.pagination.pageSize, tableData.data.length);

        paginationContainer.innerHTML = `
            <div class="pagination-info">
                ${startItem}-${endItem} / ${tableData.data.length} kayıt
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" data-page="prev" ${tableData.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                ${this.generatePageButtons(tableId, totalPages)}
                <button class="pagination-btn" data-page="next" ${tableData.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        // Event listener'ları ekle
        paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page === 'prev' && tableData.currentPage > 1) {
                    this.goToPage(tableId, tableData.currentPage - 1);
                } else if (page === 'next' && tableData.currentPage < totalPages) {
                    this.goToPage(tableId, tableData.currentPage + 1);
                } else if (!isNaN(page)) {
                    this.goToPage(tableId, parseInt(page));
                }
            });
        });
    }

    /**
     * Sayfa butonlarını oluşturur
     * @param {string} tableId - Tablo ID
     * @param {number} totalPages - Toplam sayfa sayısı
     * @returns {string} HTML
     */
    generatePageButtons(tableId, totalPages) {
        const tableData = this.tables.get(tableId);
        let buttons = '';
        
        const maxVisible = 5;
        let startPage = Math.max(1, tableData.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons += `
                <button class="pagination-btn ${i === tableData.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        return buttons;
    }

    /**
     * Sayfaya gider
     * @param {string} tableId - Tablo ID
     * @param {number} page - Sayfa numarası
     */
    goToPage(tableId, page) {
        const tableData = this.tables.get(tableId);
        if (!tableData) return;

        tableData.currentPage = page;
        this.updateTable(tableId);
        this.updatePagination(tableId);
    }

    /**
     * Tabloya veri ekler
     * @param {string} tableId - Tablo ID
     * @param {object|Array} rowData - Eklenecek veri
     */
    addData(tableId, rowData) {
        const tableData = this.tables.get(tableId);
        if (!tableData) return;

        if (Array.isArray(rowData)) {
            tableData.data.push(...rowData);
        } else {
            tableData.data.push(rowData);
        }

        this.updateTable(tableId);
        if (tableData.pagination.enabled) {
            this.updatePagination(tableId);
        }
    }

    /**
     * Tablodan veri siler
     * @param {string} tableId - Tablo ID
     * @param {string|number} rowId - Satır ID
     * @param {string} idColumn - ID sütunu
     */
    removeData(tableId, rowId, idColumn = 'id') {
        const tableData = this.tables.get(tableId);
        if (!tableData) return;

        tableData.data = tableData.data.filter(row => row[idColumn] !== rowId);
        this.updateTable(tableId);
        if (tableData.pagination.enabled) {
            this.updatePagination(tableId);
        }
    }

    /**
     * Tabloyu yeniler
     * @param {string} tableId - Tablo ID
     * @param {Array} newData - Yeni veri
     */
    refresh(tableId, newData) {
        const tableData = this.tables.get(tableId);
        if (!tableData) return;

        tableData.data = newData;
        tableData.currentPage = 1;
        this.updateTable(tableId);
        if (tableData.pagination.enabled) {
            this.updatePagination(tableId);
        }
    }

    /**
     * Tabloyu yok eder
     * @param {string} tableId - Tablo ID
     */
    destroy(tableId) {
        const table = document.getElementById(tableId);
        if (table) {
            table.remove();
        }
        
        const pagination = document.getElementById(`${tableId}-pagination`);
        if (pagination) {
            pagination.remove();
        }

        this.tables.delete(tableId);
        console.log(`[Table] Tablo yok edildi: ${tableId}`);
    }
}

// Global table manager örneği
const tableManager = new TableManager();