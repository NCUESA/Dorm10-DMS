<?php
// /api/manage_announcement.php

header('Content-Type: application/json');
require_once '../auth_check.php';

$response = ['success' => false, 'message' => '無效的操作'];
$action = $_REQUEST['action'] ?? null;

try {
    switch ($action) {
        // --- 獲取公告列表 ---
        case 'list':
            $stmt = $pdo->query("SELECT a.id, a.title, a.category, a.application_deadline, a.is_active, a.updated_at, u.username AS created_by FROM announcements a LEFT JOIN users u ON a.created_by = u.id ORDER BY a.updated_at DESC");
            $response = ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            break;

        // --- 獲取單一公告 (及其附件) ---
        case 'get':
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) throw new Exception('無效的公告 ID');

            $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ?");
            $stmt->execute([$id]);
            $announcement = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($announcement) {
                $att_stmt = $pdo->prepare("SELECT id, file_name, stored_file_path FROM attachments WHERE announcement_id = ?");
                $att_stmt->execute([$id]);
                $announcement['attachments'] = $att_stmt->fetchAll(PDO::FETCH_ASSOC);
                $response = ['success' => true, 'data' => $announcement];
            } else {
                $response['message'] = '找不到該公告';
            }
            break;

        // --- 刪除公告 ---
        case 'delete':
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                throw new Exception('無效的公告 ID');
            }

            $pdo->beginTransaction();

            // 1. 先從資料庫查出所有關聯的附件路徑
            $att_stmt = $pdo->prepare("SELECT stored_file_path FROM attachments WHERE announcement_id = ?");
            $att_stmt->execute([$id]);
            $paths_to_delete = $att_stmt->fetchAll(PDO::FETCH_COLUMN);

            // 2. 執行資料庫刪除 (利用 ON DELETE CASCADE 會一併刪除 attachments 表的紀錄)
            $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ?");
            $stmt->execute([$id]);

            // 3. 在交 commit 之前，迴圈刪除實體檔案，失敗可資料庫回滾
            foreach ($paths_to_delete as $path) {
                if ($path && file_exists('../' . $path)) {
                    if (!@unlink('../' . $path)) {
                        throw new Exception('刪除附件實體檔案時發生錯誤。');
                    }
                }
            }

            $pdo->commit();

            $response = ['success' => true, 'message' => '公告及其所有附件已成功刪除'];
            break;

        case 'delete_attachment':
            $att_id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            if (!$att_id) throw new Exception('無效的附件 ID');

            $stmt = $pdo->prepare("SELECT stored_file_path FROM attachments WHERE id = ?");
            $stmt->execute([$att_id]);
            $path = $stmt->fetchColumn();

            if ($path && file_exists('../' . $path)) {
                unlink('../' . $path); // 刪除實體檔案
            }

            $delete_stmt = $pdo->prepare("DELETE FROM attachments WHERE id = ?");
            $delete_stmt->execute([$att_id]);
            $response = ['success' => true, 'message' => '附件已刪除。'];
            break;

        // --- 新增 / 更新 公告 ---
        case 'save':
            $pdo->beginTransaction();

            // 1. 接收並清理資料
            $id = filter_input(INPUT_POST, 'announcement_id', FILTER_VALIDATE_INT);
            $title = trim($_POST['title'] ?? '');
            $summary = trim($_POST['summary'] ?? '');
            $full_content = trim($_POST['full_content'] ?? '');
            $category = $_POST['category'] ?? null;
            $application_deadline = empty($_POST['application_deadline']) ? null : $_POST['application_deadline'];
            $announcement_end_date = empty($_POST['announcement_end_date']) ? null : $_POST['announcement_end_date'];
            $target_audience = $_POST['target_audience'] ?? null;
            $application_limitations = $_POST['application_limitations'] ?? null;
            $submission_method = trim($_POST['submission_method'] ?? '') ?: null;
            $external_urls = trim($_POST['external_urls'] ?? '');
            $is_active = filter_input(INPUT_POST, 'is_active', FILTER_VALIDATE_INT) ?? 0;

            // 2. 根據輸入源，建立 source_type
            $source_types = [];
            if (!empty($_FILES['new_attachments']['name'][0])) {
                $source_types[] = 'pdf';
            }
            if (!empty($external_urls)) {
                $source_types[] = 'url';
            }
            // 如果是編輯模式，且原本就有附件，確保 'pdf' 在類型中
            if ($id) {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM attachments WHERE announcement_id = ?");
                $stmt->execute([$id]);
                if ($stmt->fetchColumn() > 0 && !in_array('pdf', $source_types)) {
                    $source_types[] = 'pdf';
                }
            }
            // 將陣列轉換為 JSON 字串儲存
            $source_type_json = empty($source_types) ? null : json_encode(array_unique($source_types));


            // 3. 後端驗證
            if (empty($title) || empty($summary)) {
                throw new Exception('公告標題和摘要為必填欄位。');
            }

            // 4. 根據 ID 判斷是新增還是更新
            if ($id) {
                // 更新模式
                $sql = "UPDATE announcements SET title=?, summary=?, full_content=?, category=?, application_deadline=?, announcement_end_date=?, target_audience=?, application_limitations=?, submission_method=?, external_urls=?, source_type=?, is_active=?, updated_at=NOW() WHERE id=?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$title, $summary, $full_content, $category, $application_deadline, $announcement_end_date, $target_audience, $application_limitations, $submission_method, $external_urls, $source_type_json, $is_active, $id]);
                $announcement_id = $id;
                $response['message'] = '公告已成功更新。';
            } else {
                // 新增模式
                $created_by = $_SESSION['user_id'];
                $sql = "INSERT INTO announcements (created_by, title, summary, full_content, category, application_deadline, announcement_end_date, target_audience, application_limitations, submission_method, external_urls, source_type, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$created_by, $title, $summary, $full_content, $category, $application_deadline, $announcement_end_date, $target_audience, $application_limitations, $submission_method, $external_urls, $source_type_json, $is_active]);
                $announcement_id = $pdo->lastInsertId();
                $response['message'] = '公告已成功新增。';
            }

            // 4. 處理新上傳的檔案
            $upload_dir = 'uploads/attachments/';
            if (!is_dir('../' . $upload_dir)) mkdir('../' . $upload_dir, 0777, true);

            if (!empty($_FILES['new_attachments']['name'][0])) {
                $att_sql = "INSERT INTO attachments (announcement_id, file_name, stored_file_path) VALUES (?, ?, ?)";
                $att_stmt = $pdo->prepare($att_sql);

                foreach ($_FILES['new_attachments']['name'] as $key => $name) {
                    if ($_FILES['new_attachments']['error'][$key] === UPLOAD_ERR_OK) {
                        $tmp_name = $_FILES['new_attachments']['tmp_name'][$key];
                        $file_extension = pathinfo($name, PATHINFO_EXTENSION);
                        $unique_name = "att_" . time() . "_" . uniqid() . "." . $file_extension;
                        $destination = $upload_dir . $unique_name;

                        if (move_uploaded_file($tmp_name, '../' . $destination)) {
                            $att_stmt->execute([$announcement_id, $name, $destination]);
                        }
                    }
                }
            }

            $pdo->commit();
            $response['success'] = true;
            break;

        default:
            $response['message'] = '未知的操作請求';
            break;
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    $response['message'] = $e->getMessage();
    error_log("Manage Announcement Error: " . $e->getMessage());
}

echo json_encode($response);
