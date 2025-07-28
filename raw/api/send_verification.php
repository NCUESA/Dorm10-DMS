<?php
// /api/send_verification.php

header('Content-Type: application/json');
require_once '../includes/db_connect.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/autoload.php';

// 初始化回應
$response = ['success' => false, 'message' => ''];
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$purpose = $_POST['purpose'] ?? 'registration'; // 'registration' or 'reset_password'

if (!$email) {
    $response['message'] = '請輸入有效的電子信箱。';
    echo json_encode($response);
    exit;
}

try {
    // 1. 檢查使用者是否存在
    $stmt_check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt_check->execute([$email]);
    $user_exists = $stmt_check->fetchColumn();

    if ($purpose === 'registration' && $user_exists) {
        throw new Exception("此電子信箱已被註冊，您可以直接登入或使用「忘記密碼」功能。");
    }
    if ($purpose === 'reset_password' && !$user_exists) {
        throw new Exception("找不到與此電子信箱關聯的帳號。");
    }

    // 2. 產生並儲存驗證碼
    $verification_code = rand(100000, 999999);
    $expiry_time_obj = new DateTime();
    $expiry_time_obj->add(new DateInterval('PT' . EMAIL_VERIFICATION_MINUTES . 'M'));
    $expiry_time_db = $expiry_time_obj->format('Y-m-d H:i:s');

    // 將驗證碼暫存在 Session 中，供註冊和重設密碼時快速驗證
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['verification_data'] = [
        'email' => strtolower($email),
        'code' => $verification_code,
        'expires' => $expiry_time_obj->getTimestamp(),
        'purpose' => $purpose
    ];

    // 如果是忘記密碼，也需要將驗證碼更新到資料庫中，作為一個備援/持久化機制
    if ($purpose === 'reset_password') {
        $stmt_save = $pdo->prepare("UPDATE users SET verification_code = ?, verification_expires = ? WHERE email = ?");
        $stmt_save->execute([$verification_code, $expiry_time_db, $email]);
    }

    // --- 3. 寄送郵件 ---
    $mail = new PHPMailer(true);

    // SMTP 伺服器設定
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USERNAME;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = "UTF-8";

    // 寄件人與收件人
    $mail->setFrom(MAIL_FROM_ADDRESS, SITE_TITLE);
    $mail->addAddress($email);

    // 郵件內容
    $mail->isHTML(true);

    if ($purpose === 'registration') {
        $subject = "帳號註冊驗證碼";
        $greeting = "感謝您註冊本平台";
    } else {
        $subject = "密碼重設驗證碼";
        $greeting = "我們收到了您的密碼重設請求";
    }

    $mail->Subject = "【" . SITE_TITLE . "】" . $subject;
    $body_content = "
        <p style='color: #333; font-size: 16px; margin-bottom: 20px;'>您好，</p>
        <p style='color: #555;'>{$greeting}，您的單次有效驗證碼如下：</p>
        
        <div style='background-color: #f0f5ff; border: 1px solid #cfe2ff; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;'>
            <div style='font-size: 42px; font-weight: 700; color: #005A9C; letter-spacing: 8px; user-select: all;'>{$verification_code}</div>
        </div>

        <p style='font-size: 14px; color: #666; text-align: center;'>此驗證碼將於 <strong>" . EMAIL_VERIFICATION_MINUTES . " 分鐘</strong>後失效。</p>
        
        <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin-top: 25px; font-size: 14px; color: #664d03;'>
            <strong>安全提醒：</strong>請勿將此驗證碼提供給任何人。
        </div>

        <p style='font-size: 14px; color: #888; margin-top: 20px;'>如果您未進行此操作，請直接忽略此郵件。</p>
    ";

    $email_header = include '../includes/email_header.php';
    $email_footer = include '../includes/email_footer.php';
    $mail->Body = $email_header . $body_content . $email_footer;
    $mail->AltBody = "您的驗證碼是： {$verification_code}。此驗證碼將於 " . EMAIL_VERIFICATION_MINUTES . " 分鐘後失效。";

    $mail->send();

    $response['success'] = true;
    $response['message'] = "驗證碼已成功發送至您的信箱，請在 " . EMAIL_VERIFICATION_MINUTES . " 分鐘內查收。";
} catch (Exception $e) {
    $response['message'] = "操作失敗：" . $e->getMessage();
    error_log("Verification Email Error: " . $mail->ErrorInfo);
}

echo json_encode($response);
