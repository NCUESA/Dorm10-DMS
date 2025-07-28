<?php
// /auth_check.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/includes/db_connect.php';

if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    $_SESSION['error_message'] = "您沒有權限存取此頁面。";
    header('Location: ' . BASE_URL . 'index.php');
    exit();
}
