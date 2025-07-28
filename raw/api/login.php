<?php
// /api/login.php

header('Content-Type: application/json');
require_once '../includes/db_connect.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$response = ['success' => false, 'message' => ''];
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    $response['message'] = '請輸入電子信箱和密碼。';
} else {
    try {
        $stmt = $pdo->prepare("SELECT id, username, email, password_hash, role FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['email'] = $user['email'];
            $response['success'] = true;
            $response['message'] = '登入成功！';
            $response['redirect'] = BASE_URL . 'index.php';
        } else {
            $response['message'] = '電子信箱或密碼錯誤。';
        }
    } catch (PDOException $e) {
        $response['message'] = '資料庫錯誤：' . $e->getMessage();
        error_log('Login Error: ' . $e->getMessage());
    }
}
echo json_encode($response);
