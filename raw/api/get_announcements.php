<?php
// /api/get_announcements.php

header('Content-Type: application/json');
require_once '../includes/db_connect.php';

// --- 根據請求參數，決定要執行哪個操作 ---
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id > 0) {
    getSingleAnnouncement($id, $pdo);
} else {
    getAnnouncementList($pdo);
}

function getSingleAnnouncement($id, $pdo)
{
    $response = ['success' => false, 'message' => '找不到公告。'];
    try {
        $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ? AND is_active = 1");
        $stmt->execute([$id]);
        $announcement = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($announcement) {
            $att_stmt = $pdo->prepare("SELECT file_name, stored_file_path FROM attachments WHERE announcement_id = ?");
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
    echo json_encode($response);
}


// --- 獲取公告列表 (搜尋、排序、分頁) ---
function getAnnouncementList($pdo)
{
    $response = ['success' => false, 'data' => [], 'pagination' => [], 'message' => '未知錯誤'];
    try {
        // 1. 接收列表參數
        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? 'applying');
        $sortBy = trim($_GET['sortBy'] ?? 'application_deadline');
        $sortOrder = trim($_GET['sortOrder'] ?? 'desc');
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // 2. 準備 SQL
        $fromSql = " FROM announcements a LEFT JOIN users u ON a.created_by = u.id";
        $whereSql = " WHERE a.is_active = 1";
        $params = [];

        if ($status === 'applying') {
            $whereSql .= " AND (a.application_deadline >= CURDATE() OR a.application_deadline IS NULL)";
        } elseif ($status === 'expired') {
            $whereSql .= " AND a.application_deadline < CURDATE()";
        }
        if (!empty($search)) {
            $whereSql .= " AND (a.title LIKE :search_title OR a.summary LIKE :search_summary OR a.target_audience LIKE :search_audience)";
            $searchParam = "%{$search}%";
            $params[':search_title'] = $searchParam;
            $params[':search_summary'] = $searchParam;
            $params[':search_audience'] = $searchParam;
        }

        // 3. 獲取總記錄數
        $countStmt = $pdo->prepare("SELECT COUNT(*) " . $fromSql . $whereSql);
        $countStmt->execute($params);
        $totalRecords = $countStmt->fetchColumn();
        $totalPages = ceil($totalRecords / $limit);

        // 4. 建立獲取當頁資料的 SQL
        $dataSql = "SELECT a.id, a.title, a.summary, a.category, a.application_deadline, a.target_audience, a.application_limitations, a.submission_method " . $fromSql . $whereSql;

        // 動態建立 ORDER BY 條件
        $allowedSortColumns = ['title' => 'a.title', 'target_audience' => 'a.target_audience', 'category' => 'a.category', 'application_deadline' => 'a.application_deadline'];
        $allowedSortOrders = ['asc', 'desc'];
        $columnToSort = array_key_exists($sortBy, $allowedSortColumns) ? $allowedSortColumns[$sortBy] : 'a.application_deadline';
        $directionToSort = in_array($sortOrder, $allowedSortOrders) ? $sortOrder : 'desc';
        if ($columnToSort === 'a.application_deadline') {
            $dataSql .= " ORDER BY CASE WHEN a.application_deadline IS NULL THEN 1 ELSE 0 END, " . $columnToSort . " " . $directionToSort;
        } else {
            $dataSql .= " ORDER BY " . $columnToSort . " " . $directionToSort;
        }
        $dataSql .= ", a.id DESC";
        $dataSql .= " LIMIT :limit OFFSET :offset";

        // 5. 準備並執行查詢
        $dataStmt = $pdo->prepare($dataSql);
        if (isset($params[':search_title'])) {
            $dataStmt->bindValue(':search_title', $params[':search_title'], PDO::PARAM_STR);
            $dataStmt->bindValue(':search_summary', $params[':search_summary'], PDO::PARAM_STR);
            $dataStmt->bindValue(':search_audience', $params[':search_audience'], PDO::PARAM_STR);
        }
        $dataStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $dataStmt->execute();
        $announcements = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        // 6. 回傳資料
        $response['success'] = true;
        $response['data'] = $announcements;
        $response['pagination'] = [
            'currentPage' => $page,
            'limit' => $limit,
            'totalPages' => $totalPages,
            'totalRecords' => (int)$totalRecords
        ];
        unset($response['message']);
    } catch (PDOException $e) {
        http_response_code(500);
        $response['message'] = '資料庫查詢失敗: ' . $e->getMessage();
        error_log("Get Announcements List Error: " . $e->getMessage());
    }
    echo json_encode($response);
}
