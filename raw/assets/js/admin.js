// /assets/js/admin.js

$(document).ready(function () {

    // =================================================================
    // 1. 變數與元素快取
    // =================================================================
    let summaryEditor;
    let newAttachments = [];
    const modal = $('#announcementManageModal');
    const modalTitle = $('#modal-title');
    const announcementForm = $('#announcement-form');
    const announcementListBody = $('#admin-announcement-list');
    const saveButton = $('#save-announcement-btn');
    const startAnalysisBtn = $('#start-ai-analysis-btn');
    const regenerateSummaryBtn = $('#regenerate-summary-btn');
    const aiStatusText = $('#ai-status-text');
    const newAttachmentsList = $('#new-attachments-list');
    const existingAttachmentsList = $('#existing-attachments-list');
    const titleInput = $('#title');
    const adminTabs = $('.admin-tabs .nav-link');
    const tabPanels = $('.admin-tabs .tab-panel');
    const userListBody = $('#user-list-body');
    const sendEmailModal = $('#sendEmailModal');
    const userSearchInput = $('#user-search-input');
    const userPaginationNav = $('#user-pagination-nav');

    let userCurrentState = { search: '', page: 1, limit: 10 };

    // =================================================================
    // 2. 核心功能函式
    // =================================================================

    // 從後端 API 載入所有公告，並渲染到主列表格中
    function loadAnnouncements() {
        announcementListBody.html('<tr><td colspan="7" style="text-align:center;">載入中...</td></tr>');
        $.ajax({
            url: '../api/manage_announcement.php', type: 'GET',
            data: { action: 'list' }, dataType: 'json'
        })
            .done(response => {
                if (response.success) renderAnnouncementTable(response.data);
                else Swal.fire('載入失敗', response.message, 'error');
            })
            .fail(() => Swal.fire('連線錯誤', '無法與伺服器通訊。', 'error'));
    }

    // 將公告資料陣列渲染成 HTML 表格的每一列
    function renderAnnouncementTable(data) {
        announcementListBody.empty();
        if (data.length === 0) {
            announcementListBody.html('<tr><td colspan="7" style="text-align:center;">目前沒有任何公告</td></tr>');
            return;
        }
        data.forEach(item => {
            const statusBadge = item.is_active == 1 ? '<span class="status-badge status-active">已上架</span>' : '<span class="status-badge status-inactive">未上架</span>';
            const deadline = item.application_deadline || 'N/A';
            const updatedAt = new Date(item.updated_at).toLocaleString('zh-TW', { hour12: false });
            const row = `<tr data-id="${item.id}"><td>${item.title}</td><td>${item.category || 'N/A'}</td><td>${deadline}</td><td>${statusBadge}</td><td>${item.created_by || 'N/A'}</td><td>${updatedAt}</td><td class="actions"><button class="btn-icon btn-edit" title="編輯"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon btn-delete" title="刪除"><i class="fas fa-trash-alt"></i></button></td></tr>`;
            announcementListBody.append(row);
        });
    }

    // 平滑動畫效果打開 Modal 視窗
    function openModal() {
        modal.css('display', 'flex');
        setTimeout(() => modal.addClass('visible'), 10);
    }

    // 平滑動畫效果關閉 Modal 視窗
    function closeModal() {
        modal.removeClass('visible');
        setTimeout(() => modal.css('display', 'none'), 300);
    }

    // 將 Modal 中的表單重設回最原始的狀態
    function resetForm() {
        announcementForm[0].reset();
        $('#announcement-id, #full-content').val('');

        // 1. 預設解鎖所有欄位
        announcementForm.find('input, textarea, select').prop('disabled', false);

        // 2. 根據初始條件，禁用特定按鈕
        saveButton.prop('disabled', true);
        regenerateSummaryBtn.prop('disabled', true);
        startAnalysisBtn.prop('disabled', true).html('AI 摘要');

        // 3. 重設 UI 狀態
        if (summaryEditor) {
            summaryEditor.setContent('');
            if (summaryEditor.mode.isReadOnly()) {
                summaryEditor.mode.set('design');
            }
        }

        $('.step').removeClass('active done processing failed');
        $('#step-1').addClass('active');
        $('#pdf-input-wrapper, #url-input-wrapper, #manual-input-wrapper').hide();
        $('.source-selection-group input[type="checkbox"]').prop('checked', false);
        setAiStatus('');

        newAttachments = [];
        renderNewAttachments();
        existingAttachmentsList.empty();
    }

    // 檢查是否可以啟用「儲存公告」按鈕
    function checkCanSave() {
        const title = titleInput.val().trim();
        let summaryContent = '';
        if (summaryEditor && summaryEditor.initialized) {
            summaryContent = summaryEditor.getContent({ format: 'text' }).trim();
        }
        saveButton.prop('disabled', !(title !== '' && summaryContent !== ''));
    }

    // 根據從 API 獲取的資料，填充表單中的各個欄位
    function populateForm(data, isFromEdit = false) {
        const existingId = $('#announcement-id').val();

        const formData = (data && data[0] !== undefined) ? data[0] : (data || {});
        $('#announcement-id').val(formData.id || existingId || '');
        $('#title').val(formData.title || '');
        $('#category').val(formData.category || '');
        $('#application_deadline').val(formData.application_deadline || '');
        $('#target_audience').val(formData.target_audience || '');
        $('#application_limitations').val(formData.application_limitations || '');
        $('#submission_method').val(formData.submission_method || '');
        $('#full-content').val(formData.full_content || '');

        if (summaryEditor) {
            summaryEditor.setContent(formData.summary || '');
        }

        $('#is_active').val(formData.is_active !== undefined ? formData.is_active : '1');

        if (formData.announcement_end_date) {
            $('#announcement_end_date').val(formData.announcement_end_date);
        } else if (formData.application_deadline && !isNaN(new Date(formData.application_deadline))) {
            let deadline = new Date(formData.application_deadline);
            deadline.setDate(deadline.getDate() + 7);
            $('#announcement_end_date').val(deadline.toISOString().split('T')[0]);
        } else {
            $('#announcement_end_date').val('');
        }

        // 只有在編輯一個已存在的公告時，才需要還原資料源的勾選狀態
        if (isFromEdit) {
            const urls = formData.external_urls || '';
            if (urls) {
                $('input[value="url"]').prop('checked', true).trigger('change');
                $('#external-urls').val(urls);
            }
        }

        // 渲染已存在的附件列表
        existingAttachmentsList.empty();
        if (formData.attachments && formData.attachments.length > 0) {
            if (isFromEdit) {
                $('input[value="pdf"]').prop('checked', true).trigger('change');
            }
            formData.attachments.forEach(att => {
                const li = `<li data-id="${att.id}"><span><i class="fas fa-paperclip"></i> ${att.file_name}</span><button type="button" class="remove-attachment-btn"><span>移除</span></button></li>`;
                existingAttachmentsList.append(li);
            });
        }
    }

    // 解鎖所有表單欄位以供審閱
    function unlockFormForReview() {
        announcementForm.find('input, textarea, select').prop('disabled', false);
        saveButton.prop('disabled', false);
        regenerateSummaryBtn.prop('disabled', false);
        if (summaryEditor && summaryEditor.mode.isReadOnly()) {
            summaryEditor.mode.set('design');
        }
    }

    // 檢查是否已提供任何資料來源以啟用 AI 分析按鈕
    function checkCanAnalyze() {
        const pdfFiles = newAttachments.length > 0;
        const urls = $('#external-urls').val().trim() !== '';
        const manualText = $('#plain-text-input').val().trim() !== '';
        startAnalysisBtn.prop('disabled', !(pdfFiles || urls || manualText));
    }

    // 設定 AI 狀態文字顯示
    function setAiStatus(text, isError = false) {
        if (text) {
            aiStatusText.text(text).toggleClass('error', isError).slideDown(200);
        } else {
            aiStatusText.slideUp(200);
        }
    }

    // 渲染新上傳的附件列表
    function renderNewAttachments() {
        newAttachmentsList.empty();
        newAttachments.forEach((file, index) => {
            const li = `<li data-index="${index}"><span><i class="fas fa-file-alt"></i> ${file.name}</span><button type="button" class="remove-attachment-btn"><span>移除</span></button></li>`;
            newAttachmentsList.append(li);
        });
    }

    // --- 使用者管理相關函式 ---
    function loadUsers() {
        userListBody.html('<tr><td colspan="5" style="text-align:center;">載入中...</td></tr>');
        userPaginationNav.empty();

        $.ajax({
            url: '../api/manage_users.php',
            type: 'GET',
            data: { action: 'list', ...userCurrentState },
            dataType: 'json'
        })
            .done(function (response) {
                userListBody.empty();

                if (response.success) {
                    const currentAdminId = response.current_user_id;

                    if (response.data.length === 0) {
                        userListBody.html('<tr><td colspan="5" style="text-align:center;">找不到符合條件的使用者。</td></tr>');
                    } else {
                        // 遍歷資料並渲染表格
                        response.data.forEach(user => {
                            const isAdmin = user.role === 'admin';
                            const isCurrentUser = user.id == currentAdminId;
                            const roleBadge = isAdmin
                                ? '<span class="status-badge" style="background-color: var(--accent-color); color: #333;">管理員</span>'
                                : '<span class="status-badge">使用者</span>';

                            const rowClass = isAdmin ? 'current-admin-row' : '';

                            const row = `
                            <tr data-user-id="${user.id}" data-username="${user.username}" data-email="${user.email}" class="${rowClass}">
                                <td>${user.student_id || 'N/A'}</td>
                                <td>${user.username}</td>
                                <td>${user.email}</td>
                                <td>${roleBadge}</td>
                                <td class="actions">
                                    <button class="btn-modern text btn-set-role" data-role="${isAdmin ? 'user' : 'admin'}" title="將權限設為${isAdmin ? '使用者' : '管理員'}" ${isCurrentUser ? 'disabled' : ''}>
                                        <i class="fas fa-user-shield"></i> <span>設為${isAdmin ? '使用者' : '管理員'}</span>
                                    </button>
                                    <button class="btn-modern text btn-send-email" title="寄信給此使用者">
                                        <i class="fas fa-envelope"></i> <span>寄信</span>
                                    </button>
                                    <button class="btn-modern text danger btn-delete-user" title="刪除此使用者" ${isCurrentUser ? 'disabled' : ''}>
                                        <i class="fas fa-trash-alt"></i> <span>刪除</span>
                                    </button>
                                </td>
                            </tr>`;
                            userListBody.append(row);
                        });
                    }
                    // 渲染分頁控制項
                    renderUserPagination(response.pagination);
                } else {
                    userListBody.html(`<tr><td colspan="5" style="text-align:center; color:red;">${response.message || '載入失敗'}</td></tr>`);
                }
            })
            .fail(function (jqXHR) {
                const errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.message : '與伺服器連線失敗。';
                userListBody.html(`<tr><td colspan="5" style="text-align:center; color:red;">${errorMsg}</td></tr>`);
            });
    }

    function renderUserPagination(pagination) {
        userPaginationNav.empty();
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

        userPaginationNav.html(paginationHtml);
    }



    // =================================================================
    // 3. TinyMCE 初始化
    // =================================================================
    tinymce.init({
        selector: '#summary-editor',
        plugins: 'table lists link image code help wordcount autoresize',
        toolbar: 'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright | ' +
            'bullist numlist outdent indent | link image | table | code | removeformat',
        height: 400,
        menubar: false,
        statusbar: false,
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 16px; line-height: 1.7; }',

        fixed_toolbar_container: document.body,

        setup: (editor) => {
            summaryEditor = editor;
            editor.on('init', () => {
                checkCanSave();
            });
            editor.on('input change undo redo', () => {
                checkCanSave();
            });
        }
    });

    // =================================================================
    // 4. 事件監聽器
    // =================================================================

    // --- 後台主頁分頁切換事件 ---
    adminTabs.on('click', function (e) {
        e.preventDefault();
        const targetPanelId = $(this).data('tab-target');

        adminTabs.removeClass('active');
        tabPanels.removeClass('active');
        $(this).addClass('active');
        $(targetPanelId).addClass('active');

        if (targetPanelId === '#users-panel') {
            userCurrentState = { search: '', page: 1, limit: 10 };
            userSearchInput.val('');
            loadUsers();
        }
    });

    // --- 主頁面與 Modal 通用按鈕 ---
    $('#add-announcement-btn').on('click', function () {
        resetForm();
        modalTitle.text('新增獎學金公告');
        openModal();
    });

    $('#close-modal-btn, #cancel-btn').on('click', closeModal);
    modal.on('click', (e) => { if ($(e.target).is(modal)) closeModal(); });

    // --- 影響儲存按鈕狀態的輸入框 ---
    titleInput.on('input', checkCanSave);

    // --- 影響 AI 分析按鈕狀態的輸入框 ---
    $('.source-selection-group').on('change', 'input[type="checkbox"]', function () {
        const type = $(this).val();
        const wrapper = $(`#${type}-input-wrapper`);
        wrapper.toggle(this.checked);
        checkCanAnalyze();
    });
    $('#external-urls, #plain-text-input').on('change input', checkCanAnalyze);
    $('#pdf-files').on('change', function (e) {
        Array.from(e.target.files).forEach(file => newAttachments.push(file));
        renderNewAttachments();
        $(this).val('');
        checkCanAnalyze();
    });

    // --- 附件移除按鈕 ---
    $('#attachment-list-container').on('click', '.remove-attachment-btn', function () {
        const li = $(this).closest('li');
        if (li.parent().is('#new-attachments-list')) {
            const index = li.data('index');
            if (index > -1) newAttachments.splice(index, 1);
            li.remove();
            checkCanAnalyze();
        } else {
            const attachmentId = li.data('id');
            const fileName = li.find('span').text().trim();
            Swal.fire({
                title: '確定要移除附件嗎？', html: `您將從伺服器永久刪除檔案：<br><strong>${fileName}</strong>`,
                icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
                confirmButtonText: '是的，移除！', cancelButtonText: '取消',
                willOpen: () => { $('.swal2-container').css('z-index', 3000); }
            }).then(result => {
                if (result.isConfirmed) {
                    $.post('../api/manage_announcement.php', { action: 'delete_attachment', id: attachmentId }, null, 'json')
                        .done(response => {
                            if (response.success) {
                                li.fadeOut(300, function () { $(this).remove(); });
                                Swal.fire('成功', '附件已移除。', 'success');
                            } else { Swal.fire('錯誤', response.message, 'error'); }
                        })
                        .fail(() => Swal.fire('連線錯誤', '無法與伺服器通訊。', 'error'));
                }
            });
        }
    });

    // --- AI 分析與儲存等核心按鈕 ---
    startAnalysisBtn.on('click', function () {
        setAiStatus('正在準備與上傳資料...');
        $(this).html('<i class="fas fa-spinner fa-spin"></i> 處理中...').prop('disabled', true);
        $('.source-input-wrapper input, .source-input-wrapper textarea').prop('disabled', true);
        const formData = new FormData();
        newAttachments.forEach(file => formData.append('pdf_files[]', file));
        formData.append('external_urls', $('#external-urls').val());
        formData.append('manual_text', $('#plain-text-input').val());

        $.ajax({
            url: '../api/generate_summary.php', type: 'POST', data: formData,
            processData: false, contentType: false, dataType: 'json'
        })
            .done(summaryResponse => {
                if (!summaryResponse.success || !summaryResponse.data) throw new Error(summaryResponse.message || "AI 回傳的資料格式不正確。");
                populateForm(summaryResponse.data, false);
                unlockFormForReview();
                $('#step-1').addClass('done');
                setAiStatus('AI 分析完成！');
                $('#step-2').removeClass('processing').addClass('done');
                $('#step-3').addClass('active');
            })
            .fail(error => {
                const errorMsg = error.responseJSON ? error.responseJSON.message : (error.message || '發生未知錯誤');
                Swal.fire('分析失敗', errorMsg, 'error');
                setAiStatus(`分析失敗：${errorMsg}`, true);
                $('#step-2').removeClass('processing').addClass('failed');
                $('.source-input-wrapper input, .source-input-wrapper textarea').prop('disabled', false);
                checkCanAnalyze();
            })
            .always(() => {
                $(this).html('AI 摘要');
                if ($('#step-2').hasClass('done')) $(this).prop('disabled', true);
            });
    });


    regenerateSummaryBtn.on('click', function () {
        const fullContent = $('#full-content').val();
        if (!fullContent) {
            Swal.fire('錯誤', '沒有可供重新生成的原始文字內容。', 'error');
            return;
        }

        const btn = $(this);
        btn.html('<i class="fas fa-spinner fa-spin"></i> 重新生成中...').prop('disabled', true);
        setAiStatus('正在根據原文重新請求 AI 分析...');
        $('#step-2').removeClass('done failed').addClass('processing');

        // 傳送 action='regenerate' 和 full_content
        $.ajax({
            url: '../api/generate_summary.php',
            type: 'POST',
            data: {
                action: 'regenerate',
                full_content: fullContent
            },
            dataType: 'json'
        })
            .done(response => {
                if (response.success && response.data) {
                    Swal.fire('成功', '已重新生成摘要與欄位！', 'success');
                    populateForm(response.data, true);
                    setAiStatus('重新生成完成！');
                    $('#step-2').removeClass('processing').addClass('done');
                } else {
                    throw new Error(response.message || '重新生成失敗。');
                }
            })
            .fail((jqXHR) => {
                const errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.message : '重新生成時發生錯誤';
                Swal.fire('錯誤', errorMsg, 'error');
                setAiStatus(`重新生成失敗：${errorMsg}`, true);
                $('#step-2').removeClass('processing').addClass('failed');
            })
            .always(() => {
                btn.html('<i class="fas fa-sync-alt"></i> 重新生成摘要').prop('disabled', false);
            });
    });

    saveButton.on('click', function () {

        if (summaryEditor) {
            summaryEditor.save(); // 同步 TinyMCE 內容到 textarea
        }

        const formElement = document.getElementById('announcement-form');
        const formData = new FormData(formElement);
        formData.append('action', 'save');
        formData.append('external_urls', $('#external-urls').val());
        formData.append('full_content', $('#full-content').val());
        newAttachments.forEach(file => {
            formData.append('new_attachments[]', file);
        });

        $(this).html('<i class="fas fa-spinner fa-spin"></i> 儲存中...').prop('disabled', true);

        $.ajax({
            url: '../api/manage_announcement.php',
            type: 'POST',
            data: formData,
            processData: false, contentType: false, dataType: 'json'
        })
            .done(response => {
                if (response.success) {
                    closeModal();
                    Swal.fire('成功', response.message, 'success');
                    loadAnnouncements();
                } else {
                    Swal.fire('儲存失敗', response.message, 'error');
                }
            })
            .fail(() => Swal.fire('連線錯誤', '儲存操作失敗。', 'error'))
            .always(() => {
                // 還原按鈕狀態
                $(this).html('<i class="fas fa-save"></i> 儲存公告');
            });
    });

    announcementListBody.on('click', '.btn-edit', function () {
        const id = $(this).closest('tr').data('id');
        resetForm();
        modalTitle.text('編輯獎學金公告');
        Swal.fire({ title: '正在載入資料...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        $.ajax({ url: '../api/manage_announcement.php', type: 'GET', data: { action: 'get', id: id }, dataType: 'json' })
            .done(response => {
                Swal.close();
                if (response.success && response.data) {
                    // 呼叫 populateForm 時，傳入 true 表示這是編輯模式
                    populateForm(response.data, true);
                    unlockFormForReview();
                    $('#step-1, #step-2').addClass('done');
                    $('#step-3').addClass('active');
                    // 編輯模式下，AI 分析按鈕預設禁用，除非使用者新增了資料源
                    startAnalysisBtn.prop('disabled', true);
                    openModal();
                } else {
                    Swal.fire('錯誤', response.message || '找不到該公告資料', 'error');
                }
            })
            .fail(() => Swal.fire('連線錯誤', '無法獲取公告資料。', 'error'));
    });

    announcementListBody.on('click', '.btn-delete', function () {
        const row = $(this).closest('tr');
        const id = row.data('id');
        const title = row.find('td:first').text();
        Swal.fire({
            title: '確定要刪除嗎？', html: `您將永久刪除：<br><strong>${title}</strong>`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            cancelButtonText: '取消', confirmButtonText: '是的，刪除！'
        }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '../api/manage_announcement.php', type: 'POST',
                    data: { action: 'delete', id: id }, dataType: 'json'
                })
                    .done(response => {
                        if (response.success) {
                            Swal.fire('已刪除！', response.message, 'success');
                            loadAnnouncements();
                        } else {
                            Swal.fire('刪除失敗', response.message, 'error');
                        }
                    })
                    .fail(() => Swal.fire('連線錯誤', '刪除失敗。', 'error'));
            }
        });
    });

    // --- 使用者管理面板內的事件 ---

    // 搜尋框輸入 (Debounce)
    let userSearchTimer;
    userSearchInput.on('keyup', function () {
        clearTimeout(userSearchTimer);
        userSearchTimer = setTimeout(() => {
            userCurrentState.search = $(this).val();
            userCurrentState.page = 1;
            loadUsers();
        }, 300);
    });

    // 分頁按鈕點擊
    userPaginationNav.on('click', 'a.page-link', function (e) {
        e.preventDefault();
        const parentLi = $(this).parent();
        if (parentLi.hasClass('disabled') || parentLi.hasClass('active')) return;
        userCurrentState.page = $(this).data('page');
        loadUsers();
    });

    // 變更權限按鈕點擊
    userListBody.on('click', '.btn-set-role', function () {
        const row = $(this).closest('tr');
        const userId = row.data('user-id');
        const username = row.data('username');
        const newRole = $(this).data('role');

        Swal.fire({
            title: `確定要將 "${username}" 設為${newRole === 'admin' ? '管理員' : '一般使用者'}嗎？`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: '確定變更',
            cancelButtonText: '取消'
        }).then(result => {
            if (result.isConfirmed) {
                $.post('../api/manage_users.php', { action: 'set_role', id: userId, role: newRole }, function (response) {
                    if (response.success) {
                        Swal.fire('成功', response.message, 'success');
                        loadUsers(); // 重新載入列表以更新狀態
                    } else {
                        Swal.fire('失敗', response.message, 'error');
                    }
                }, 'json');
            }
        });
    });

    // 刪除使用者按鈕點擊
    userListBody.on('click', '.btn-delete-user', function () {
        const row = $(this).closest('tr');
        const userId = row.data('user-id');
        const username = row.data('username');

        Swal.fire({
            title: `確定要永久刪除使用者 "${username}" 嗎？`,
            text: "此操作無法復原！",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: '是的，刪除！',
            cancelButtonText: '取消'
        }).then(result => {
            if (result.isConfirmed) {
                $.post('../api/manage_users.php', { action: 'delete', id: userId }, function (response) {
                    if (response.success) {
                        Swal.fire('已刪除', response.message, 'success');
                        loadUsers();
                    } else {
                        Swal.fire('失敗', response.message, 'error');
                    }
                }, 'json');
            }
        });
    });

    // 寄信按鈕點擊
    userListBody.on('click', '.btn-send-email', function () {
        const row = $(this).closest('tr');
        $('#email-recipient-id').val(row.data('user-id'));
        $('#email-recipient-info').text(`${row.data('username')} (${row.data('email')})`);
        $('#send-email-form')[0].reset();

        sendEmailModal.css('display', 'flex').addClass('visible');
    });

    // --- 寄信 Modal 內部事件 ---
    $('#close-email-modal-btn, #cancel-email-btn').on('click', function () {
        sendEmailModal.removeClass('visible').css('display', 'none');
    });

    $('#send-email-btn').on('click', function () {
        const form = $('#send-email-form');
        const btn = $(this);
        const originalText = btn.html();
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> 寄送中...');

        $.post('../api/manage_users.php', form.serialize() + '&action=send_email', function (response) {
            if (response.success) {
                sendEmailModal.removeClass('visible').css('display', 'none');
                Swal.fire('成功', response.message, 'success');
            } else {
                Swal.fire('失敗', response.message, 'error');
            }
        }, 'json').always(() => {
            btn.prop('disabled', false).html(originalText);
        });
    });

    // =================================================================
    // 5. 初始執行
    // =================================================================

    loadAnnouncements();

});