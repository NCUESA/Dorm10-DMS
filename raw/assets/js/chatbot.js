// /assets/js/chatbot.js

$(document).ready(function () {

    // --- 1. 元素快取與變數定義 ---
    const chatWindow = $('#chat-window');
    const chatForm = $('#chat-form');
    const chatInput = $('#chat-input');
    const clearHistoryBtn = $('#clear-history-btn');
    const loggedInUserName = window.currentUserName || 'User';

    const API_BASE_URL = window.API_BASE_URL || '/';

    // 用於儲存前端的對話歷史，以便發送給後端
    let conversationHistory = [];
    // 標記，防止在 AI 回應時重複發送請求
    let isRequesting = false;
    // 用於快取已載入的公告卡片HTML，避免重複請求
    let announcementCache = {};

    // --- 2. Marked.js 設定 ---
    const renderer = new marked.Renderer();
    const originalLinkRenderer = renderer.link;

    // 重寫 link 方法
    renderer.link = (href, title, text) => {
        if (href && typeof href === 'string' && href.includes('[object Object]')) {
            return text;
        }
        const html = originalLinkRenderer.call(renderer, href, title, text);
        return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
    };

    marked.setOptions({
        renderer: renderer,
        gfm: true,
        breaks: true
    });

    // --- 3. 核心功能函式 ---

    function scrollToBottom() {
        chatWindow.stop().animate({ scrollTop: chatWindow[0].scrollHeight }, 500);
    }

    function renderMessage(role, rawContent, timestamp) {
        const name = role === 'user' ? loggedInUserName : 'AI';

        const avatarHTML = role === 'user'
            ? `<div class="avatar">${name.substring(0, 1).toUpperCase()}</div>`
            : `<div class="avatar"><img src="${API_BASE_URL}assets/images/logo.png" alt="AI"></div>`;

        const messageContainerClass = role === 'user' ? 'user-message' : 'model-message';
        const time = new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

        let displayContent = rawContent || '';
        let announcementIds = [];
        const cardRegex = /\[ANNOUNCEMENT_CARD:([\d,]+)\]/g;

        const cardMatch = cardRegex.exec(displayContent);
        if (cardMatch && cardMatch[1]) {
            announcementIds = cardMatch[1].split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0);
            displayContent = displayContent.replace(/\[ANNOUNCEMENT_CARD:[\d,]+\]/g, '').trim();
        }

        const htmlContent = marked.parse(displayContent);

        let cardPlaceholdersHTML = '';
        if (announcementIds.length > 0) {
            announcementIds.forEach(id => {
                cardPlaceholdersHTML += `<div class="announcement-card-placeholder mt-3" data-announcement-id="${id}"></div>`;
            });
        }

        const messageHTML = `
            <div class="chat-message ${messageContainerClass}">
                <div class="avatar-group">
                    ${avatarHTML}
                    <div class="avatar-name">${name}</div>
                </div>
                <div class="message-content-wrapper">
                    <div class="message-bubble">
                        ${htmlContent}
                        ${cardPlaceholdersHTML}
                    </div>
                    <div class="message-timestamp">${time}</div>
                </div>
            </div>`;

        chatWindow.append(messageHTML);

        // 渲染完成後，觸發所有公告卡片佔位符的載入
        $('.announcement-card-placeholder').each(function () {
            if (!$(this).data('rendered')) {
                $(this).data('rendered', true);
                renderAnnouncementCard($(this));
            }
        });

        $('#human-support-btn-wrapper').remove();
        if (conversationHistory.length > 0) {
            const supportBtnHTML = `<div class="support-btn-wrapper" id="human-support-btn-wrapper"><button id="human-support-btn"><i class="fas fa-headset"></i> AI 無法解決？尋求真人支援</button></div>`;
            chatWindow.append(supportBtnHTML);
        }

        scrollToBottom();
    }

    // 非同步載入並渲染單個公告卡片
    function renderAnnouncementCard(placeholder) {
        const id = placeholder.data('announcement-id');
        if (!id) return;

        if (announcementCache[id]) {
            placeholder.replaceWith(announcementCache[id]);
            return;
        }

        placeholder.html('<div class="p-3 text-center"><div class="spinner-border spinner-border-sm"></div> <span class="ms-2">卡片載入中...</span></div>');

        $.get(API_BASE_URL + 'api/get_single_announcement.php', { id: id }, function (response) {
            if (response.success && response.data) {
                const item = response.data;

                let attachmentsHtml = '';
                if (item.attachments && item.attachments.length > 0) {
                    attachmentsHtml += `<div class="card-attachments">`;
                    item.attachments.forEach(att => {
                        attachmentsHtml += `<a href="${att.url}" target="_blank" rel="noopener noreferrer" class="attachment-pill">
                                                <i class="fas fa-file-pdf"></i>
                                                <span>${att.file_name}</span>
                                            </a>`;
                    });
                    attachmentsHtml += `</div>`;
                }

                const cardHTML = `
                    <div class="announcement-card-in-chat">
                        <div class="card-header">
                            <i class="fas fa-bullhorn"></i>
                            <span>${item.title}</span>
                        </div>
                        <div class="card-body">${item.summary || '無摘要資訊。'}</div>
                        ${attachmentsHtml} 
                    </div>`;
                announcementCache[id] = cardHTML;
                placeholder.replaceWith(cardHTML);
            } else {
                placeholder.replaceWith(`<div class="small text-danger p-2">${response.message || '無法載入此參考公告。'}</div>`);
            }
        }, 'json');
    }

    // 從後端載入歷史對話紀錄
    function loadHistory() {
        chatWindow.html('<div class="text-center p-5"><div class="spinner-border" style="color: var(--primary-color);"></div></div>');
        $.ajax({
            url: API_BASE_URL + 'api/chatbot_handler.php',
            type: 'GET',
            data: { action: 'get_history' },
            dataType: 'json'
        })
            .done(function (response) {
                chatWindow.empty();
                conversationHistory = [];
                if (response.success && Array.isArray(response.data) && response.data.length > 0) {
                    response.data.forEach(msg => {
                        renderMessage(msg.role, msg.message_content, msg.timestamp || new Date());
                        // 只儲存純文字內容，避免將 HTML 標籤再次發送給後端
                        conversationHistory.push({ role: msg.role, message_content: msg.message_content });
                    });
                } else {
                    renderMessage('model',
                        `歡迎使用 NCUE 獎學金 AI 助理，很高興為您服務。

為了節省您的寶貴時間，我能提供以下協助：
*   **搜尋平台公告**：為您快速查找最新的獎學金申請資格、時程與辦法。
*   **搜尋網路資訊**：當平台內沒有答案時，我會搜尋外部網站，提供最相關的資訊。
*   **自動保存對話**：您的所有提問都會被妥善保存，方便您隨時回來查閱。

現在，請直接輸入您的問題開始吧！`,
                        new Date());
                }
            })
            .fail(() => {
                chatWindow.html('<div class="alert alert-danger mx-3">無法載入歷史紀錄，請重新整理頁面。</div>');
            });
    }

    // =================================================================
    // 4. 事件監聽器
    // =================================================================

    chatForm.on('submit', function (e) {
        e.preventDefault();
        if (isRequesting) return;
        const message = chatInput.val().trim();
        if (!message) return;

        const userMsgData = { role: 'user', message_content: message };
        renderMessage(userMsgData.role, userMsgData.message_content, new Date());
        conversationHistory.push(userMsgData);

        chatInput.val('');
        isRequesting = true;
        chatInput.prop('disabled', true);
        $('#chat-submit-btn').prop('disabled', true);

        const thinkingHTML = `<div class="chat-message model-message" id="thinking-indicator"><div class="avatar-group"><div class="avatar"><img src="${API_BASE_URL}assets/images/logo.png" alt="AI"></div><div class="avatar-name">AI</div></div><div class="message-content-wrapper"><div class="message-bubble"><div class="spinner-grow spinner-grow-sm" style="color: var(--primary-color);"></div><span> AI 正在思考中...</span></div></div></div>`;
        chatWindow.append(thinkingHTML);
        scrollToBottom();

        $.ajax({
            url: API_BASE_URL + 'api/chatbot_handler.php',
            type: 'POST',
            data: {
                action: 'send_message',
                message: message,
                history: JSON.stringify(conversationHistory)
            },
            dataType: 'json'
        })
            .done(function (response) {
                if (response.success && response.data) {
                    renderMessage(response.data.role, response.data.message_content, new Date());
                    conversationHistory.push({ role: response.data.role, message_content: response.data.message_content });
                } else {
                    renderMessage('model', response.message || '抱歉，我目前遇到了一些問題，請稍後再試。', new Date());
                }
            })
            .fail(() => {
                renderMessage('model', '抱歉，系統連線失敗，請檢查您的網路或稍後再試。', new Date());
            })
            .always(function () {
                $('#thinking-indicator').remove();
                isRequesting = false;
                chatInput.prop('disabled', false).focus();
                $('#chat-submit-btn').prop('disabled', false);
            });
    });

    clearHistoryBtn.on('click', function () {
        Swal.fire({
            title: '確定要清除所有對話紀錄嗎？',
            text: "此操作無法復原！",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: '取消',
            confirmButtonText: '確定清除'
        }).then((result) => {
            if (result.isConfirmed) {
                $.post(API_BASE_URL + 'api/chatbot_handler.php', { action: 'clear_history' }, function (response) {
                    if (response.success) {
                        Swal.fire('成功', response.message, 'success');
                        loadHistory();
                    } else {
                        Swal.fire('失敗', response.message, 'error');
                    }
                }, 'json');
            }
        });
    });

    // --- 真人支援按鈕事件 ---
    chatWindow.on('click', '#human-support-btn', function () {
        const btn = $(this);
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> 正在傳送請求...');

        $.post(API_BASE_URL + 'api/chatbot_handler.php', { action: 'request_human_support' }, function (response) {
            if (response.success) {
                Swal.fire('請求已發送', response.message, 'success');
            } else {
                Swal.fire('傳送失敗', response.message, 'error');
            }
        }, 'json').always(function () {
            btn.prop('disabled', false).html('<i class="fas fa-headset"></i> AI 無法解決？尋求真人支援');
        });
    });

    // =================================================================
    // 5. 初始執行
    // =================================================================
    loadHistory();
});