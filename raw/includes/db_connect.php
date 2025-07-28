<?php
// /includes/db_connect.php

require_once __DIR__ . '/../config.php';

if (!defined('BASE_URL')) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host_name = $_SERVER['HTTP_HOST'];
    $script_dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));

    if (basename($script_dir) === 'api' || basename($script_dir) === 'admin') {
        $base_path = dirname($script_dir);
    } else {
        $base_path = $script_dir;
    }

    if ($base_path === '/' || $base_path === '\\') {
        $base_path = '';
    }

    $final_base_url = $protocol . $host_name . rtrim($base_path, '/') . '/';

    define('BASE_URL', $final_base_url);
}

// --- DB 連線設定 ---
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (\PDOException $e) {
    error_log("Database Connection Error: " . $e->getMessage());
    die("資料庫連線失敗，請聯繫平台開發者(3526ming@gmail.com)。");
}