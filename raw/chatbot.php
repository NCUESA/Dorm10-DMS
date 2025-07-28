<?php
// /chatbot.php

require_once 'auth_check.php';
require_once 'includes/header.php';

// 將使用者的姓名傳遞給 JavaScript，用於顯示頭像和對話
$user_name_js = json_encode($_SESSION['username'] ?? 'User');
?>

<style>
    :root {
        --chat-bg: #f8f9fa;
        --chat-surface-bg: #ffffff;
        --user-bubble-bg: var(--primary-color);
        --model-bubble-bg: #e9ecef;
        --input-wrapper-bg: #ffffff;
        --glow-1: #8e44ad;
        --glow-2: #3498db;
        --glow-3: #1abc9c;
        --glow-4: #f1c40f;
        --glow-5: #e74c3c;
    }

    body.chatbot-page .main-container {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
        height: calc(100vh - var(--header-height) - 2rem);
    }

    #chat-container {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--chat-surface-bg);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
        overflow: hidden;
    }

    #chat-window {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px 20px 150px 20px;
    }

    .chat-message {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        margin-bottom: 20px;
        max-width: 85%;
    }

    .user-message {
        margin-left: auto;
        flex-direction: row-reverse;
    }

    .message-content-wrapper {
        display: flex;
        flex-direction: column;
        max-width: calc(100% - 60px);
    }

    .user-message .message-content-wrapper {
        align-items: flex-end;
    }

    .model-message .message-content-wrapper {
        align-items: flex-start;
    }

    .avatar-group {
        width: 45px;
        flex-shrink: 0;
        text-align: center;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        overflow: hidden;
    }

    .model-message .avatar {
        background-color: #ced4da;
    }

    .user-message .avatar {
        background-color: var(--primary-color);
    }

    .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .avatar-name {
        font-size: 0.7rem;
        color: #888;
        margin-top: 5px;
    }

    .message-bubble {
        padding: 12px 18px;
        border-radius: 22px;
        line-height: 1.7;
        font-size: 1rem;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .user-message .message-bubble {
        background: var(--user-bubble-bg);
        color: white;
        border-bottom-right-radius: 6px;
    }

    .model-message .message-bubble {
        background-color: var(--model-bubble-bg);
        color: #343a40;
        border-bottom-left-radius: 6px;
    }

    .message-timestamp {
        font-size: 0.7rem;
        color: #adb5bd;
        margin-top: 6px;
        padding: 0 5px;
    }

    .user-message .message-timestamp {
        text-align: right;
    }

    .message-bubble table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #dee2e6;
    }

    .message-bubble th,
    .message-bubble td {
        border: 1px solid #dee2e6;
        padding: 0.7rem 0.9rem;
        text-align: left;
    }

    .message-bubble th {
        font-weight: bold;
        background-color: #f8f9fa;
    }

    .message-bubble ul,
    .message-bubble ol {
        padding-left: 20px;
    }

    .message-bubble a {
        color: var(--primary-color);
        font-weight: 500;
    }

    .message-bubble img {
        display: block;
        max-width: 300px;
        width: 100%;
        height: auto;
        margin: 15px auto 0;
        border-radius: 18px;
    }

    .ai-disclaimer {
        border-top: 1px solid #d1d9e1;
        margin-top: 1rem;
        padding-top: 0.8rem;
        font-size: 0.75rem;
        color: #6c757d;
        font-style: italic;
    }

    .announcement-card-in-chat {
        background-color: #fff;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        margin-top: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .announcement-card-in-chat .card-header {
        background: #eef5ff;
        color: var(--primary-color);
        font-weight: 600;
        font-size: 1rem;
        padding: 0.75rem 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        border-bottom: 1px solid #dee2e6;
    }

    .announcement-card-in-chat .card-body {
        padding: 1.25rem;
        font-size: 0.95rem;
        line-height: 1.7;
    }

    .announcement-card-in-chat .card-body> :first-child {
        margin-top: 0;
    }

    .announcement-card-in-chat .card-body> :last-child {
        margin-bottom: 0;
    }

    .announcement-card-in-chat .card-attachments {
        padding: 0 1.25rem 1.25rem 1.25rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .announcement-card-in-chat .attachment-pill {
        display: inline-flex;
        align-items: center;
        background-color: #f8f9fa;
        color: #495057;
        padding: 0.4rem 0.9rem;
        border-radius: 2rem;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 500;
        border: 1px solid #dee2e6;
        transition: all 0.2s ease;
    }

    .announcement-card-in-chat .attachment-pill:hover {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .announcement-card-in-chat .attachment-pill i {
        margin-right: 0.5rem;
    }

    .announcement-card-in-chat .card-actions {
        padding: 0.75rem 1.25rem;
        background-color: #f8f9fa;
        text-align: right;
        border-top: 1px solid #e9ecef;
    }

    .announcement-card-in-chat .btn-view-detail {
        color: var(--primary-color);
        font-weight: 600;
        text-decoration: none;
    }

    .floating-input-area {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1rem 1.5rem;
        background: linear-gradient(to top, var(--chat-surface-bg) 70%, transparent);
        pointer-events: none;
    }

    .chat-input-wrapper {
        position: relative;
        border-radius: 50px;
        padding: 2px;
        background: linear-gradient(90deg, var(--glow-1), var(--glow-2), var(--glow-3), var(--glow-4), var(--glow-5), var(--glow-1));
        background-size: 400%;
        animation: glowing-border-flow 10s linear infinite;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        pointer-events: auto;
    }

    @keyframes glowing-border-flow {
        0% {
            background-position: 400% 0;
        }

        100% {
            background-position: 0% 0;
        }
    }

    #chat-form {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        background-color: var(--chat-surface-bg);
        border-radius: 50px;
        padding: 6px 8px 6px 20px;
    }

    #chat-input {
        flex-grow: 1;
        background: transparent;
        border: none;
        outline: none !important;
        box-shadow: none !important;
        font-size: 1rem;
    }

    #clear-history-btn {
        flex-shrink: 0;
        background-color: transparent;
        color: #868e96;
        border: none;
        border-radius: 20px;
        padding: 6px 12px;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-right: 0.5rem;
    }

    #clear-history-btn:hover {
        color: var(--error-color);
        background-color: rgba(220, 53, 69, 0.1);
    }

    #chat-submit-btn {
        flex-shrink: 0;
        border: none;
        background: var(--primary-color);
        color: #fff;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        transition: background-color 0.2s;
    }

    #chat-submit-btn:hover {
        background: #004a85;
    }

    .support-btn-wrapper {
        text-align: center;
        margin: 20px 0 10px;
    }

    #human-support-btn {
        background-image: linear-gradient(to right, #6ab6f9ff, #005cb7ff);
        padding: 10px 25px;
        text-align: center;
        transition: 0.5s;
        background-size: 200% auto;
        color: white;
        border-radius: 50px;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    #human-support-btn:hover {
        background-position: right center;
        transform: translateY(-1px);
    }
</style>

<script>
    document.body.classList.add('chatbot-page');
</script>

<div id="chat-container">
    <div id="chat-window">
        <!-- 初始載入動畫 -->
        <div class="text-center p-5">
            <div class="spinner-border" style="color: var(--primary-color);"></div>
        </div>
    </div>

    <div class="floating-input-area">
        <div class="chat-input-wrapper">
            <form id="chat-form" class="gap-2">
                <input type="text" id="chat-input" class="form-control" placeholder="詢問獎學金相關問題..." autocomplete="off" required>
                <button type="button" class="btn" id="clear-history-btn" title="清除對話紀錄">
                    <i class="fas fa-trash-alt"></i>
                    <span>清除紀錄</span>
                </button>
                <button type="submit" class="btn" id="chat-submit-btn" title="發送">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
<!-- 引入必要的 JS 檔案 -->
<script>
    const currentUserName = <?= $user_name_js ?>;
</script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="<?= BASE_URL ?>assets/js/chatbot.js"></script>