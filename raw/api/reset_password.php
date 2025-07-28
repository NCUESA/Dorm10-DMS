<?php
// /api/reset_password.php
header('Content-Type: application/json');
require_once '../includes/db_connect.php';

$response = ['success' => false, 'message' => ''];
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$verification_code = trim($_POST['verification_code'] ?? '');
$new_password = $_POST['new_password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

if (empty($email) || empty($verification_code) || empty($new_password)) {
    $response['message'] = '所有欄位皆為必填。';
} elseif ($new_password !== $confirm_password) {
    $response['message'] = '兩次輸入的新密碼不一致。';
} elseif (strlen($new_password) < 8) {
    $response['message'] = '新密碼至少需為 8 位混和字元。';
} else {
    try {
        $stmt = $pdo->prepare("SELECT id, verification_expires FROM users WHERE email = ? AND verification_code = ?");
        $stmt->execute([$email, $verification_code]);
        $user = $stmt->fetch();

        if (!$user) {
            $response['message'] = '驗證碼錯誤或無效。';
        } elseif (strtotime($user['verification_expires']) < time()) {
            $response['message'] = '驗證碼已過期，請重新申請。';
        } else {
            $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt_update = $pdo->prepare("UPDATE users SET password_hash = ?, verification_code = NULL, verification_expires = NULL WHERE id = ?");
            if ($stmt_update->execute([$password_hash, $user['id']])) {
                $response['success'] = true;
                $response['message'] = '密碼重設成功！您現在可以使用新密碼登入。';
            } else {
                $response['message'] = '密碼更新失敗，請稍後再試。';
            }
        }
    } catch (PDOException $e) {
        $response['message'] = '資料庫錯誤：' . $e->getMessage();
        error_log('Reset Password Error: ' . $e->getMessage());
    }
}
echo json_encode($response);
