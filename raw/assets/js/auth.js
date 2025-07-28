// /assets/js/auth.js

$(document).ready(function () {

    // --- 1. 檢查 Modal 是否存在 ---
    const authModalEl = document.getElementById('authModal');
    if (!authModalEl) {
        return;
    }

    // --- 2. 只有在 Modal 存在時，才定義所有相關的變數和函式 ---
    const authModal = $('#authModal');
    const modalTitle = $('#authModalLabel');
    const modalBody = $('#authModalBody');
    const loginContainer = $('#login-form-container');
    const registerContainer = $('#register-form-container');
    const forgotPasswordContainer = $('#forgot-password-form-container');
    const loginPromptMessage = $('#login-prompt-message');

    let countdownInterval;
    const API_BASE_URL = window.API_BASE_URL || '/';

    const swalOptions = { customClass: { container: 'high-z-index-swal' } };
    if ($('.high-z-index-swal').length === 0) {
        $('<style>.high-z-index-swal { z-index: 3000 !important; }</style>').appendTo('head');
    }

    // --- 3. 核心控制函式 ---

    function openAuthModal() {
        authModal.css('display', 'flex');
        setTimeout(() => authModal.addClass('visible'), 10);
    }
    function closeAuthModal() {
        authModal.removeClass('visible');
        setTimeout(() => authModal.css('display', 'none'), 300);
    }

    // 切換顯示不同的、已預載入的表單
    function switchForm(formType) {
        clearInterval(countdownInterval);
        modalBody.find('form').removeClass('was-validated');
        loginContainer.hide();
        registerContainer.hide();
        forgotPasswordContainer.hide();
        loginPromptMessage.hide();

        if (formType === 'login') {
            modalTitle.text('使用者登入');
            loginContainer.show();
        } else if (formType === 'register') {
            modalTitle.text('使用者註冊');
            registerContainer.show();
        } else if (formType === 'forgot_password') {
            modalTitle.text('忘記密碼');
            forgotPasswordContainer.show();
        }
    }

    // 發送驗證碼
    function sendVerificationCode(buttonSelector, emailSelector, msgSelector, purpose) {
        const button = $(buttonSelector);
        const email = $(emailSelector).val();
        if (!email) {
            Swal.fire(Object.assign({}, swalOptions, {
                icon: 'error',
                title: '輸入錯誤',
                text: '請先輸入有效的電子信箱。'
            }));
            return;
        }
        const originalText = button.text();
        button.prop('disabled', true).text('發送中...');
        const msgElement = $(msgSelector);
        msgElement.text('').removeClass('text-success text-danger');

        $.post(API_BASE_URL + 'api/send_verification.php', { email: email, purpose: purpose }, null, 'json')
            .done(function (response) {
                if (response.success) {
                    msgElement.text(response.message).addClass('text-success');
                    let seconds = 60;
                    button.text(`${seconds}秒後可重發`);
                    countdownInterval = setInterval(() => {
                        seconds--;
                        button.text(`${seconds}秒後可重發`);
                        if (seconds <= 0) {
                            clearInterval(countdownInterval);
                            button.prop('disabled', false).text(originalText);
                        }
                    }, 1000);
                } else {
                    msgElement.text(response.message || '發送失敗').addClass('text-danger');
                    button.prop('disabled', false).text(originalText);
                }
            })
            .fail(() => {
                msgElement.text('請求失敗，請檢查網路連線。').addClass('text-danger');
                button.prop('disabled', false).text(originalText);
            });
    }

    // =================================================================
    // 4. 事件監聽器綁定
    // =================================================================

    // --- 觸發 Modal 開啟 ---
    $('#login-trigger-btn, #register-trigger-btn, #chatbot-login-trigger').on('click', function (e) {
        e.preventDefault();
        const triggerId = $(this).attr('id');

        if (triggerId === 'register-trigger-btn') {
            switchForm('register');
        } else {
            switchForm('login');
        }

        if (triggerId === 'chatbot-login-trigger') {
            loginPromptMessage.text('請先登入或註冊才能使用 AI 獎學金助理功能。').show();
        }

        openAuthModal();
    });

    // --- Modal 內部事件 ---
    authModal.on('click', '#auth-close-modal-btn', closeAuthModal);
    authModal.on('click', function (e) { if ($(e.target).is(authModal)) closeAuthModal(); });

    authModal.on('click', '.toggle-password', function () {
        const input = $(this).closest('.input-group').find('input[type="password"], input[type="text"]');
        const icon = $(this).find('i');
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    authModal.on('click', '#switch-to-login-link, #back-to-login-link, back-to-login-link-2', (e) => { e.preventDefault(); switchForm('login'); });
    authModal.on('click', '#switch-to-register-link', (e) => { e.preventDefault(); switchForm('register'); });
    authModal.on('click', '#switch-to-forgot-password-link', (e) => { e.preventDefault(); switchForm('forgot_password'); });

    authModal.on('click', '#send-verification-btn', () => sendVerificationCode('#send-verification-btn', '#reg-email', '#verification-msg', 'registration'));
    authModal.on('click', '#send-reset-code-btn', () => sendVerificationCode('#send-reset-code-btn', '#reset-email', '#reset-verification-msg', 'reset_password'));

    // --- 表單提交事件 ---
    authModal.on('submit', 'form', function (e) {
        e.preventDefault();
        const form = $(this);
        const formId = form.attr('id');

        let apiEndpoint, onSuccess;

        if (formId === 'login-form') {
            apiEndpoint = 'api/login.php';
            onSuccess = (response) => {
                Swal.fire(Object.assign({}, swalOptions, {
                    icon: 'success', title: response.message, timer: 1500,
                    showConfirmButton: false, timerProgressBar: true,
                })).then(() => { window.location.reload(true); });
            };
        } else if (formId === 'register-form') {
            apiEndpoint = 'api/register.php';
            onSuccess = (response) => {
                Swal.fire(Object.assign({}, swalOptions, {
                    icon: 'success', title: '註冊成功！', text: response.message
                }));
                switchForm('login');
            };
        } else if (formId === 'forgot-password-form') {
            apiEndpoint = 'api/reset_password.php';
            onSuccess = (response) => {
                Swal.fire(Object.assign({}, swalOptions, {
                    icon: 'success', title: '密碼已重設！', text: response.message
                }));
                switchForm('login');
            };
        } else {
            return;
        }

        const submitButton = form.find('button[type="submit"]');
        const originalButtonHtml = submitButton.html();
        submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 處理中...');

        $.post(API_BASE_URL + apiEndpoint, form.serialize(), null, 'json')
            .done(response => {
                if (response.success) onSuccess(response);
                else Swal.fire(Object.assign({}, swalOptions, { icon: 'error', title: '操作失敗', text: response.message }));
            })
            .fail(() => Swal.fire(Object.assign({}, swalOptions, { icon: 'error', title: '請求錯誤', text: '無法與伺服器通訊。' })))
            .always(() => submitButton.prop('disabled', false).html(originalButtonHtml));
    });

});