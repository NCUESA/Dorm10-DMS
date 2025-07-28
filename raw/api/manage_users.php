<?php
// /api/manage_users.php

header('Content-Type: application/json');
require_once '../auth_check.php';
require_once '../config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/autoload.php';

$response = ['success' => false, 'message' => '無效的操作。'];
$action = $_POST['action'] ?? $_GET['action'] ?? null;
$current_user_id = $_SESSION['user_id'];

try {
    switch ($action) {
        case 'list':
            $search = trim($_GET['search'] ?? '');
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $offset = ($page - 1) * $limit;

            $baseSql = "FROM users";
            $whereClauses = [];
            $params = [];

            if (!empty($search)) {
                $whereClauses[] = "(username LIKE ? OR email LIKE ? OR student_id LIKE ?)";
                $searchParam = "%{$search}%";

                $params[] = $searchParam;
                $params[] = $searchParam;
                $params[] = $searchParam;
            }

            if (!empty($whereClauses)) {
                $baseSql .= " WHERE " . implode(" AND ", $whereClauses);
            }

            $totalStmt = $pdo->prepare("SELECT COUNT(*) " . $baseSql);
            $totalStmt->execute($params);
            $totalRecords = $totalStmt->fetchColumn();

            $dataSql = "SELECT id, student_id, username, email, role " . $baseSql . " ORDER BY role DESC, created_at DESC LIMIT ? OFFSET ?";

            $params[] = $limit;
            $params[] = $offset;

            $dataStmt = $pdo->prepare($dataSql);
            $dataStmt->execute($params);
            $users = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

            $response = [
                'success' => true,
                'data' => $users,
                'current_user_id' => $current_user_id,
                'pagination' => [
                    'totalRecords' => (int)$totalRecords,
                    'totalPages' => ceil($totalRecords / $limit),
                    'currentPage' => $page
                ]
            ];
            break;

        case 'set_role':
            $user_id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            $new_role = $_POST['role'] === 'admin' ? 'admin' : 'user';
            if (!$user_id) throw new Exception('無效的使用者 ID。');
            if ($user_id == $current_user_id) throw new Exception('無法變更自己的權限。');

            $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmt->execute([$new_role, $user_id]);
            $response = ['success' => true, 'message' => '使用者權限已更新。'];
            break;

        case 'delete':
            $user_id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            if (!$user_id) throw new Exception('無效的使用者 ID。');
            if ($user_id == $current_user_id) throw new Exception('無法刪除自己。');

            $pdo->prepare("DELETE FROM chat_history WHERE user_id = ?")->execute([$user_id]);

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $response = ['success' => true, 'message' => '使用者已成功刪除。'];
            break;

        case 'send_email':
            $user_id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            $subject = trim($_POST['subject'] ?? '');
            $body = trim($_POST['body'] ?? '');
            if (!$user_id || empty($subject) || empty($body)) {
                throw new Exception('所有欄位皆為必填。');
            }

            $stmt = $pdo->prepare("SELECT email, username FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$recipient) throw new Exception('找不到該使用者。');

            // --- 寄送郵件 ---
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = SMTP_HOST;
            $mail->SMTPAuth = true;
            $mail->Username = SMTP_USERNAME;
            $mail->Password = SMTP_PASSWORD;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = 465;
            $mail->CharSet = "UTF-8";

            $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
            $mail->addAddress($recipient['email'], $recipient['username']);
            $mail->isHTML(true);
            $mail->Subject = "【" . SITE_TITLE . "】重要訊息：" . $subject;

            $email_header_content = include '../includes/email_header.php';
            $email_footer_content = include '../includes/email_footer.php';

            $email_main_content = "<div style='padding: 20px;'>" . nl2br(htmlspecialchars($body)) . "</div>";
            $mail->Body = $email_header_content . $email_main_content . $email_footer_content;

            $mail->send();
            $response = ['success' => true, 'message' => '郵件已成功寄送。'];
            break;

        default:
            throw new Exception('未知的操作。');
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    error_log("User Management Error: " . $e->getMessage());
}

echo json_encode($response);
