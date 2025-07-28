<?php
// /config.php

// --- DB 設定 ---
define('DB_HOST', '');
define('DB_NAME', '');
define('DB_USER', '');
define('DB_PASS', '');
define('DB_CHARSET', '');

// --- 網站基本設定 ---
define('SITE_TITLE', '');
define('SITE_LOGO_PATH', '');

// --- SMTP 郵件伺服器設定 ---
define('SMTP_HOST', '');
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
define('SMTP_PORT', 465);
define('SMTP_SECURE', '');

// --- 寄件人資訊 ---
define('MAIL_FROM_ADDRESS', '');
define('MAIL_FROM_NAME', '');

define('EMAIL_VERIFICATION_MINUTES', 5);
date_default_timezone_set('Asia/Taipei');

// 部署時應使用環境變數管理
define('SERP_API_KEY', '');
define('GEMINI_API_KEY', '');

?>

init: 
feat: 
finish:
fix: