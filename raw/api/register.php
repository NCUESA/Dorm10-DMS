<?php
// /api/register.php

header('Content-Type: application/json');
require_once '../includes/db_connect.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$response = ['success' => false, 'message' => ''];

// --- 接收表單欄位 ---
$student_id = trim($_POST['student_id'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';
$verification_code = trim($_POST['verification_code'] ?? '');

// --- 後端驗證 ---
if (empty($student_id) || empty($username) || empty($email) || empty($password) || empty($verification_code)) {
    $response['message'] = '所有欄位皆為必填。';
} elseif (!preg_match('/^[a-zA-Z]\d{7}$/i', $student_id)) {
    $response['message'] = '學號格式不正確 (應為 1 位英文字母 + 7 位數字)。';
} elseif ($password !== $confirm_password) {
    $response['message'] = '兩次輸入的密碼不一致。';
} elseif (strlen($password) < 8) {
    $response['message'] = '密碼至少需為 8 個混和字元。';
} elseif (
    !isset($_SESSION['verification_data']) ||
    strtolower($_SESSION['verification_data']['email']) !== strtolower($email) ||
    $_SESSION['verification_data']['code'] != $verification_code ||
    time() > $_SESSION['verification_data']['expires']
) {
    $response['message'] = '驗證碼錯誤、與信箱不符或已過期。';
} else {
    try {
        // --- 檢查信箱或學號是否已被註冊 ---
        $stmt_check = $pdo->prepare("SELECT id FROM users WHERE email = :email OR student_id = :student_id");
        $stmt_check->execute([':email' => $email, ':student_id' => $student_id]);

        if ($stmt_check->fetch()) {
            $response['message'] = '此電子信箱或學號已被註冊。';
        } else {
            // --- 寫入資料庫 ---
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt_insert = $pdo->prepare(
                "INSERT INTO users (student_id, username, email, password_hash, role) VALUES (?, ?, ?, ?, 'user')"
            );

            if ($stmt_insert->execute([$student_id, $username, $email, $password_hash])) {
                $response['success'] = true;
                $response['message'] = '註冊成功！您現在可以登入。';
                unset($_SESSION['verification_data']);
            } else {
                $response['message'] = '註冊失敗，請稍後再試。';
            }
        }
    } catch (PDOException $e) {
        if ($e->errorInfo[1] == 1062) {
            $response['message'] = '資料庫錯誤：電子信箱或學號重複。';
        } else {
            $response['message'] = '資料庫錯誤，請聯繫管理員。';
        }
        error_log('Registration Error: ' . $e->getMessage());
    }
}

echo json_encode($response);
