// /assets/js/script.js

$(document).ready(function () {

    // =================================================================
    // 1. 變數與元素快取
    // =================================================================
    let currentState = {
        search: '',
        status: 'applying',
        sortBy: 'application_deadline',
        sortOrder: 'desc',
        page: 1,
        limit: 10
    };
    const listBody = $('#announcement-list-body');
    const searchInput = $('#search-input');
    const statusFilters = $('.status-filters .filter-btn');
    const sortLinks = $('.scholarship-list-table th a');
    const detailModal = $('#announcementDetailModal');
    const paginationNav = $('#pagination-nav');
    const limitSelect = $('#limit-select');
    const API_BASE_URL = window.API_BASE_URL || '/';
    const mobileMenuToggle = $('#mobile-menu-toggle');
    const mainNav = $('#main-nav');
    const mainContainer = $('.main-container');

    // =================================================================
    // 2. 核心功能函式
    // =================================================================

    function fetchAndRenderAnnouncements() {
        listBody.html('<tr><td colspan="4" class="no-data-row">載入中...</td></tr>');
        paginationNav.empty();
        $.get({
            url: API_BASE_URL + 'api/get_announcements.php',
            data: currentState,
            dataType: 'json'
        })
            .done(response => {
                if (response.success) {
                    renderTable(response.data);
                    renderPagination(response.pagination);
                } else {
                    renderError(response.message || '無法載入資料。');
                }
            })
            .fail((jqXHR) => {
                renderError('與伺服器連線失敗。');
            });
    }

    function renderTable(data) {
        listBody.empty();
        if (data.length === 0) {
            listBody.html('<tr class="no-data-row"><td colspan="4">查無符合條件的獎學金資訊</td></tr>');
            return;
        }
        data.forEach(item => {
            const limitationTag = item.application_limitations?.toUpperCase().startsWith('Y') 
                ? '<span class="limitation-tag limitation-yes">Y</span>' 
                : '<span class="limitation-tag limitation-no">N</span>';
            const deadlineText = item.application_deadline 
                ? new Date(item.application_deadline).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })
                : '無指定期限';
            
            // 如果送件方式為空，提供一個預設文字
            const submissionText = item.submission_method || '依公告內文為主';

            const row = `
                <tr class="list-row" data-id="${item.id}">
                    <td data-label="獎助學金資料">
                        <span class="category-tag category-${(item.category || 'd').toLowerCase()}">${item.category || 'D'}</span>
                        <h4 class="item-title">${item.title}</h4>
                    </td>
                    <td data-label="適用對象">${item.target_audience || '未指定'}</td>
                    <td data-label="兼領限制">${limitationTag}</td>
                    <td data-label="申請期限 / 送件方式">
                        <span class="deadline">${deadlineText}</span>
                        <span class="submission-method">${submissionText}</span>
                    </td>
                </tr>`;
            listBody.append(row);
        });
    }

    function renderError(message) {
        listBody.html(`<tr class="no-data-row"><td colspan="4" style="color: var(--error-color);">${message}</td></tr>`);
        paginationNav.empty();
    }

    function updateSortIcons() {
        sortLinks.find('i').remove();
        const activeLink = $(`.scholarship-list-table th a[data-sort="${currentState.sortBy}"]`);
        const iconClass = currentState.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        activeLink.append(` <i class="${iconClass}"></i>`);
    }


    function renderPagination(pagination) {
        paginationNav.empty();
        if (!pagination || pagination.totalPages <= 1) return;
        const { totalPages, currentPage } = pagination;
        const createPageItem = (text, page, isDisabled = false, isActive = false) => {
            let classes = 'page-item';
            if (isDisabled) classes += ' disabled';
            if (isActive) classes += ' active';
            return `<li class="${classes}"><a class="page-link" href="#" data-page="${page}">${text}</a></li>`;
        };
        let paginationHtml = '<ul class="pagination">';
        paginationHtml += createPageItem('«', currentPage - 1, currentPage === 1);
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += createPageItem(i, i, false, i === currentPage);
        }
        paginationHtml += createPageItem('»', currentPage + 1, currentPage === totalPages);
        paginationHtml += '</ul>';
        paginationNav.html(paginationHtml);
    }

    // --- Modal 相關函式 ---
    function openDetailModal() {
        detailModal.css('display', 'flex');
        setTimeout(() => detailModal.addClass('visible'), 10);
    }

    function closeDetailModal() {
        detailModal.removeClass('visible');
        setTimeout(() => detailModal.css('display', 'none'), 300);
    }

    function renderDetailModal(data) {
        $('#detail-modal-title').text(data.title);

        // --- 處理附件區塊 ---
        let attachmentsHtml = '';
        // 檢查後端回傳的資料中，是否有 attachments 陣列且其長度大於 0
        if (data.attachments && data.attachments.length > 0) {
            attachmentsHtml += `
                <div class="detail-section">
                    <h4><i class="fas fa-paperclip"></i> 相關附件</h4>
                    <div class="attachment-pills">`;
            data.attachments.forEach(att => {
                if (att.url) {
                    attachmentsHtml += `
                        <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="attachment-pill">
                            <i class="fas fa-file-pdf"></i>
                            <span>${att.file_name}</span>
                        </a>`;
                }
            });
            attachmentsHtml += `</div></div>`;
        }

        // --- 處理相關連結區塊 ---
        let urlsHtml = '';
        if (data.external_urls) {
            urlsHtml += `
                <div class="detail-section">
                    <h4><i class="fas fa-link"></i> 相關連結</h4>
                    <ul class="detail-urls">`;
            const urls = data.external_urls.split(/[\n\s,]+/);
            urls.forEach(url => {
                if (url) {
                    // 為沒有 http/https 的連結補上協議
                    const fullUrl = url.startsWith('http') ? url : 'http://' + url;
                    urlsHtml += `<li><a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a></li>`;
                }
            });
            urlsHtml += `</ul></div>`;
        }

        // --- 組合最終內容並注入到 Modal 中 ---
        const content = `
            <div class="detail-modal-content">
                <div class="detail-summary">${data.summary || '<p>無摘要資訊。</p>'}</div>
                ${attachmentsHtml}
                ${urlsHtml}
            </div>
        `;
        $('#detail-modal-body').html(content);
    }


    // =================================================================
    // 3. 事件監聽器
    // =================================================================

    searchInput.on('keyup', function () {
        clearTimeout($.data(this, 'timer'));
        const newSearch = $(this).val();
        $(this).data('timer', setTimeout(() => {
            currentState.search = newSearch;
            fetchAndRenderAnnouncements();
        }, 300));
    });

    statusFilters.on('click', function () {
        statusFilters.removeClass('active');
        $(this).addClass('active');
        currentState.status = $(this).data('filter');
        fetchAndRenderAnnouncements();
    });

    mobileMenuToggle.on('click', function() {
        mainNav.slideToggle(400, function() {
            const navHeight = mainNav.outerHeight(); // 獲取選單的實際高度
            if (mainNav.is(':visible')) {
                mainContainer.css({
                    'transition': 'padding-top 0.4s ease-in-out',
                    'padding-top': navHeight + 'px'
                });
            } else {
                mainContainer.css('padding-top', '0px');
            }
        });
    });

    mainNav.on('click', 'a', function() {
        if (mobileMenuToggle.is(':visible')) {
            mainNav.slideUp(400, () => {
                mainContainer.css('padding-top', '0px');
            });
        }
    });

    // 排序點擊事件
    sortLinks.on('click', function (e) {
        e.preventDefault();
        const newSortBy = $(this).data('sort');
        if (!newSortBy) return;
        if (currentState.sortBy === newSortBy) {
            currentState.sortOrder = currentState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            currentState.sortBy = newSortBy;
            currentState.sortOrder = 'desc';
        }
        currentState.page = 1;
        updateSortIcons();
        fetchAndRenderAnnouncements();
    });
    // 分頁點擊事件
    paginationNav.on('click', 'a.page-link', function (e) {
        e.preventDefault();
        if ($(this).parent().hasClass('disabled') || $(this).parent().hasClass('active')) return;
        currentState.page = $(this).data('page');
        fetchAndRenderAnnouncements();
    });

    // 每頁顯示筆數變更事件
    limitSelect.on('change', function () {
        currentState.limit = $(this).val();
        currentState.page = 1;
        fetchAndRenderAnnouncements();
    });

    // 點擊列表中任一列
    listBody.on('click', 'tr.list-row', function() {
        const id = $(this).data('id');
        if (!id) return;

        $('#detail-modal-body').html('<p style="text-align: center; padding: 2rem;">載入中...</p>');
        openDetailModal();
        
        $.get({
            url: API_BASE_URL + 'api/get_single_announcement.php',
            data: { id: id },
            dataType: 'json'
        })
        .done(response => {
            if (response.success && response.data) {
                renderDetailModal(response.data);
            } else {
                $('#detail-modal-body').html(`<p style="color:red; text-align: center; padding: 2rem;">${response.message || '載入失敗'}</p>`);
            }
        })
        .fail(() => {
            $('#detail-modal-body').html('<p style="color:red; text-align: center; padding: 2rem;">無法取得公告詳細資訊。</p>');
        });
    });

    $('#detail-close-modal-btn').on('click', closeDetailModal);
    detailModal.on('click', (e) => { if ($(e.target).is(detailModal)) closeDetailModal(); });

    // =================================================================
    // 4. 初始執行
    // =================================================================
    fetchAndRenderAnnouncements();
    updateSortIcons();
});