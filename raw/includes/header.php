<?php
// /includes/header.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/db_connect.php';

$current_page = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="zh-Hant-TW">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars(SITE_TITLE) ?></title>

    <script>
        const API_BASE_URL = '<?= BASE_URL ?>';
    </script>

    <link rel="icon" type="image/png" href="<?= BASE_URL ?>assets/images/logo_b.png">
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/style.css">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>


<body>
    <header class="site-header">
        <a href="<?= BASE_URL ?>index.php" class="logo-link">
            <img src="<?= BASE_URL ?>assets/images/logo.png" alt="Site Logo" class="logo-img">
            <span class="logo-text"><?= htmlspecialchars(SITE_TITLE) ?></span>
        </a>

        <nav id="main-nav">
            <ul>
                <li><a href="<?= BASE_URL ?>index.php" class="nav-link <?php if ($current_page == 'index.php') echo 'active'; ?>">首頁</a></li>

                <li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="<?= BASE_URL ?>chatbot.php" class="nav-link <?php if ($current_page == 'chatbot.php') echo 'active'; ?>">AI 獎學金助理</a>
                    <?php else: ?>
                        <a href="#" id="chatbot-login-trigger" class="nav-link <?php if ($current_page == 'chatbot.php') echo 'active'; ?>">AI 獎學金助理</a>
                    <?php endif; ?>
                </li>

                <?php if (isset($_SESSION['user_id'])): ?>
                    <!-- 已登入狀態 -->
                    <?php if ($_SESSION['role'] === 'admin'): ?>
                        <li><a href="<?= BASE_URL ?>admin/announcements.php" class="nav-link <?php if (strpos($_SERVER['REQUEST_URI'], '/admin/') !== false) echo 'active'; ?>">管理後台</a></li>
                    <?php endif; ?>
                    <li><a href="<?= BASE_URL ?>logout.php" class="nav-link">登出</a></li>
                    <li><span class="nav-username">Hi, <?= htmlspecialchars($_SESSION['username']) ?></span></li>
                <?php else: ?>
                    <!-- 未登入狀態 -->
                    <li><a href="#" id="login-trigger-btn" class="nav-link">登入</a></li>
                    <li><a href="#" id="register-trigger-btn" class="nav-link">註冊</a></li>
                <?php endif; ?>
            </ul>
        </nav>

        <button id="mobile-menu-toggle" class="mobile-menu-btn">
            <i class="fas fa-bars"></i>
        </button>

    </header>

    <main class="main-container">