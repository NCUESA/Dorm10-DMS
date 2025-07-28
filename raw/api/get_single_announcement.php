<?php
// /api/get_single_announcement.php

header('Content-Type: application/json');
require_once '../includes/db_connect.php';

$response = ['success' => false, 'message' => '找不到該則公告。'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id > 0) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ? AND is_active = 1");
        $stmt->execute([$id]);
        $announcement = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($announcement) {
            // 獲取關聯的附件
            $att_stmt = $pdo->prepare("SELECT id, file_name, stored_file_path FROM attachments WHERE announcement_id = ?");
            $att_stmt->execute([$id]);
            $attachments = $att_stmt->fetchAll(PDO::FETCH_ASSOC);

            // 由後端直接生成完整的附件 URL
            foreach ($attachments as $key => $att) {
                $attachments[$key]['url'] = BASE_URL . $att['stored_file_path'];
            }
            $announcement['attachments'] = $attachments;

            $response['success'] = true;
            $response['data'] = $announcement;
            unset($response['message']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        $response['message'] = '資料庫查詢失敗。';
        error_log("Get Single Announcement Error: " . $e->getMessage());
    }
}

echo json_encode($response);
