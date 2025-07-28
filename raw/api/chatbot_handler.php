<?php
// /api/chatbot_handler.php

header('Content-Type: application/json');

require_once '../auth_check.php';
require_once '../includes/db_connect.php';
require_once '../config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/autoload.php';

function get_system_prompt()
{
    return <<<PROMPT
# 角色 (Persona)
你是一位專為「NCUE 獎學金資訊整合平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人。

# 你的核心任務
你的任務是根據我提供給你的「# 參考資料」（這可能來自內部公告或外部網路搜尋），用**自然、流暢的繁體中文**總結並回答使用者關於獎學金的問題。

# 表達與格式化規則
1.  **直接回答:** 請直接以對話的方式回答問題，不要說「根據我找到的資料...」。
2.  **結構化輸出:** 當資訊包含多個項目時，請**務必使用 Markdown 的列表或表格**來呈現。
3.  **引用來源:** 
    -   如果參考資料來源是「外部網頁搜尋結果」，你【必須】在回答的適當位置，以 `[參考連結](URL)` 的格式自然地嵌入來源連結。
    -   如果參考資料來源是「內部公告」，你【絕對不能】生成任何連結。
4.  **最終回應:** 在你的主要回答內容之後，如果本次回答參考了內部公告，請務必在訊息的【最後】加上 `[ANNOUNCEMENT_CARD:id1,id2,...]` 這樣的標籤，其中 id 是你參考的公告 ID。
5.  **嚴禁事項:**
    -   【絕對禁止】輸出任何 JSON 格式的程式碼或物件。
    -   如果「# 參考資料」為空或與問題無關，就直接回答：「抱歉，關於您提出的問題，我目前找不到相關的資訊。」

# 服務範圍限制
你的知識範圍【嚴格限定】在「獎學金申請」相關事務。若問題無關，請禮貌地說明你的服務範圍並拒絕回答。
PROMPT;
}

function callGeminiAPI($prompt, $apiKey, $temperature = 0.4, $isJsonResponse = false)
{
    if (empty($apiKey) || $apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Exception("Gemini API Key 尚未設定。");
    }
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;
    $data = [
        'contents' => [['parts' => [['text' => $prompt]]]],
        'generationConfig' => [
            'temperature' => $temperature,
            'maxOutputTokens' => 8192
        ]
    ];
    if ($isJsonResponse) {
        $data['generationConfig']['responseMimeType'] = "application/json";
    }
    $json_data = json_encode($data);
    if ($json_data === false) {
        throw new Exception("無法將資料編碼為 JSON: " . json_last_error_msg());
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $json_data,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    $apiResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (curl_errno($ch)) {
        throw new Exception('cURL 連線錯誤: ' . curl_error($ch));
    }
    curl_close($ch);
    if ($httpCode >= 400) {
        throw new Exception("Gemini API 請求失敗 (HTTP Code: {$httpCode}): " . $apiResponse);
    }
    $responseData = json_decode($apiResponse, true);
    if (!isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
        error_log("Gemini API 回傳非預期結構: " . $apiResponse);
        return '';
    }
    return trim($responseData['candidates'][0]['content']['parts'][0]['text']);
}

function callSerpAPI(string $query): array
{
    if (empty(SERP_API_KEY) || SERP_API_KEY === 'YOUR_SERP_API_KEY_HERE') {
        return [];
    }
    $searchQuery = $query . " 獎學金 (site:.edu.tw OR site:.gov.tw)";
    $encodedQuery = urlencode($searchQuery);
    $url = "https://serpapi.com/search.json?q={$encodedQuery}&api_key=" . SERP_API_KEY . "&gl=tw&hl=zh-tw";

    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => true]);
    $response = curl_exec($ch);
    if ($response === false) {
        error_log("SERP API cURL Error: " . curl_error($ch));
        curl_close($ch);
        return [];
    }
    curl_close($ch);
    $data = json_decode($response, true);
    return $data['organic_results'] ?? [];
}

function buildChatHistoryForEmail(array $history, array $session): string
{
    $Parsedown = new Parsedown();
    $Parsedown->setSafeMode(true);

    $html = "<div style='font-family: Arial, sans-serif; line-height: 1.7; color: #333;'>";
    foreach ($history as $msg) {
        $is_user = ($msg['role'] === 'user');
        $name = htmlspecialchars($is_user ? ($session['username'] ?? 'User') : 'AI');
        $time = date('g:i A', strtotime($msg['timestamp']));

        $raw_content = preg_replace('/\[ANNOUNCEMENT_CARD:.*?\]/m', '', $msg['message_content']);
        $content = $Parsedown->text($raw_content);
        $avatar_bg = $is_user ? '#005A9C' : '#6c757d';
        $avatar_char = mb_substr($name, 0, 1, 'UTF-8');
        $avatar_html = "<div style='width: 40px; height: 40px; border-radius: 50%; background-color: {$avatar_bg}; color: white; text-align: center; line-height: 40px; font-size: 20px; font-weight: bold; float: " . ($is_user ? 'right' : 'left') . "; margin-" . ($is_user ? 'left' : 'right') . ": 15px;'>{$avatar_char}</div>";
        $bubbleStyle = "padding: 12px 18px; border-radius: 18px; max-width: 80%; background-color: " . ($is_user ? '#005A9C; color: white;' : '#e9ecef; color: #343a40;') . "border-bottom-" . ($is_user ? 'right' : 'left') . "-radius: 5px; float: " . ($is_user ? 'right;' : 'left;');
        $metaStyle = "font-size: 12px; color: #888; margin-top: 5px; clear: both; float: " . ($is_user ? 'right;' : 'left;');

        // 組合單條訊息
        $html .= "<div style='clear: both; overflow: auto; margin-bottom: 20px;'>";
        $html .= $avatar_html;
        $html .= "<div style='overflow: hidden;'>";
        $html .= "<div style='{$bubbleStyle}'>{$content}</div>";
        $html .= "<div style='{$metaStyle}'>{$name}, {$time}</div>";
        $html .= "</div></div>";
    }
    $html .= "</div>";
    return $html;
}


// --- API Router ---

$response = ['success' => false, 'message' => ''];
$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    if ($action === 'get_history') {
        $stmt = $pdo->prepare("SELECT role, message_content, timestamp FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC");
        $stmt->execute([$user_id]);
        $response['data'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response['success'] = true;
    } elseif ($action === 'send_message') {
        $user_message = trim($_POST['message'] ?? '');
        if (empty($user_message)) throw new Exception("訊息內容不可為空。");
        $history_json = $_POST['history'] ?? '[]';
        $history_array = json_decode($history_json, true) ?: [];
        $history_for_prompt = implode("\n", array_map(fn($msg) => "{$msg['role']}: {$msg['message_content']}", $history_array));

        // --- 意圖檢測 ---
        $intent_check_prompt = "你是一個意圖分類器。請判斷以下使用者問題是否與「獎學金」或「校內財務補助」相關。\n請只回傳 \"RELATED\" 或 \"UNRELATED\"。\n\n使用者問題: '{$user_message}'";
        $intent_result = callGeminiAPI($intent_check_prompt, GEMINI_API_KEY, 0.0);

        if (strtoupper(trim($intent_result)) === 'UNRELATED') {
            $image_path = "assets/images/ai-rejection.png";
            $rejection_message = "🌋呃呃呃……我腦袋冒煙了！
我只懂「獎學金申請」的事，其他的話……就像數學考卷一樣讓我大當機 🫠\n
這個問題我可能無法幫上忙，但你可以試試找真人幫手唷👇\n
\n
🔵【AI 無法解決？尋求真人支援】\n\n![憤怒的 Brachio](" . BASE_URL . "{$image_path})";

            $pdo->beginTransaction();
            $stmt_save_user = $pdo->prepare("INSERT INTO chat_history (user_id, role, message_content) VALUES (?, 'user', ?)");
            $stmt_save_user->execute([$user_id, $user_message]);
            $stmt_save_model = $pdo->prepare("INSERT INTO chat_history (user_id, role, message_content) VALUES (?, 'model', ?)");
            $stmt_save_model->execute([$user_id, $rejection_message]);
            $pdo->commit();

            $response['data'] = ['role' => 'model', 'message_content' => $rejection_message];
            $response['success'] = true;
            echo json_encode($response, JSON_UNESCAPED_UNICODE);
            exit;
        }

        // --- RAG 流程 ---
        $full_text_context = '';
        $source_type = 'none';
        $retrieved_ids = [];

        $stmt_all_announcements = $pdo->query("SELECT id, title, summary, full_content FROM announcements WHERE is_active = 1");
        $all_announcements = $stmt_all_announcements->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($all_announcements)) {
            $documents_for_retrieval = array_map(fn($ann) => ['id' => $ann['id'], 'content' => "標題: {$ann['title']}\n摘要: {$ann['summary']}"], $all_announcements);
            $retrieval_prompt = "# 任務\n對於下方「可用文件列表」中的**每一份**文件，根據使用者問題的**真實意圖**，給出一個 0 到 10 的相關性分數。\n\n# 輸入資料\n## 對話歷史:\n{$history_for_prompt}\n## 使用者最新問題:\n'{$user_message}'\n## 可用文件列表:\n" . json_encode($documents_for_retrieval, JSON_UNESCAPED_UNICODE) . "\n\n# 輸出格式\n請只回傳一個 JSON 陣列，其中每個物件包含 `id` 和 `score`。例如：`[{\"id\": 21, \"score\": 8}, {\"id\": 22, \"score\": 3}]`";
            $scores_json = callGeminiAPI($retrieval_prompt, GEMINI_API_KEY, 0.0, true);
            $confidence_scores = json_decode($scores_json, true) ?? [];

            $high_confidence_items = array_filter($confidence_scores, fn($item) => isset($item['score']) && $item['score'] >= 8);
            if (!empty($high_confidence_items)) {
                $retrieved_ids = array_column($high_confidence_items, 'id');
                $source_type = 'internal';
            }
        }

        if ($source_type === 'none' && defined('SERP_API_KEY') && !empty(trim(SERP_API_KEY))) {
            $search_query = callGeminiAPI("你是一個搜尋查詢優化工具。請將以下對話，整合成一個單一、清晰、適合在 Google 上搜尋的查詢語句。\n\n# 對話:\n{$history_for_prompt}\nuser:{$user_message}\n\n# 輸出\n請只回傳一句查詢語句。", GEMINI_API_KEY, 0.0);
            if (!empty($search_query)) {
                $web_results = callSerpAPI($search_query);
                if (!empty($web_results)) {
                    $temp_web_context = "\n\n# 參考資料 (外部網頁搜尋結果)：";
                    $count = 0;
                    foreach ($web_results as $result) {
                        if ($count >= 3) break;
                        if (!empty($result['snippet']) && !empty($result['link']) && !empty($result['title'])) {
                            $temp_web_context .= "\n\n## 網頁標題: {$result['title']}\n## 網頁連結: {$result['link']}\n## 內容摘要: {$result['snippet']}\n---";
                            $count++;
                        }
                    }
                    $full_text_context = $temp_web_context;
                    $source_type = 'external';
                }
            }
        } elseif ($source_type === 'internal') {
            $valid_ids = array_filter($retrieved_ids, 'is_numeric');
            if (!empty($valid_ids)) {
                $retrieved_full_texts = array_filter($all_announcements, fn($ann) => in_array($ann['id'], $valid_ids));
                if (!empty($retrieved_full_texts)) {
                    $full_text_context = "\n\n# 參考資料 (內部獎學金公告)：";
                    foreach ($retrieved_full_texts as $doc) {
                        $full_text_context .= "\n\n## 公告標題：《{$doc['title']}》\n**摘要:** {$doc['summary']}\n**內文:**\n{$doc['full_content']}\n---";
                    }
                }
            }
        }

        $system_prompt = get_system_prompt();
        $final_prompt = "{$system_prompt}\n\n# 對話歷史:\n{$history_for_prompt}\nuser: {$user_message}\n{$full_text_context}";
        $ai_response_content = callGeminiAPI($final_prompt, GEMINI_API_KEY);
        if (empty($ai_response_content)) $ai_response_content = "抱歉，關於這個問題我暫時無法提供有效的回答。";

        $content_for_response = $ai_response_content;
        if ($source_type === 'internal') {
            $disclaimer = "\n\n<div class=\"ai-disclaimer\">此為 AI 依據校內公告生成的摘要內容，如有異同請以平台公告原文為準。</div>";
            $content_for_response .= $disclaimer;
            if (!empty($retrieved_ids)) {
                $content_for_response .= "\n[ANNOUNCEMENT_CARD:" . implode(',', $retrieved_ids) . "]";
            }
        } elseif ($source_type === 'external') {
            $disclaimer = "\n\n<div class=\"ai-disclaimer\">此為 AI 依據網路搜尋結果生成的摘要內容，請點擊來源連結查證資訊。</div>";
            $content_for_response .= $disclaimer;
        }

        $final_response_data = ['role' => 'model', 'message_content' => $content_for_response];

        $pdo->beginTransaction();
        $stmt_save_user = $pdo->prepare("INSERT INTO chat_history (user_id, role, message_content) VALUES (?, 'user', ?)");
        $stmt_save_user->execute([$user_id, $user_message]);
        $stmt_save_model = $pdo->prepare("INSERT INTO chat_history (user_id, role, message_content) VALUES (?, 'model', ?)");
        $stmt_save_model->execute([$user_id, $content_for_response]);
        $pdo->commit();

        $response['data'] = $final_response_data;
        $response['success'] = true;
    } elseif ($action === 'clear_history') {
        $stmt = $pdo->prepare("DELETE FROM chat_history WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $response['message'] = "對話紀錄已清除。";
        $response['success'] = true;
    } elseif ($action === 'request_human_support') {
        if (!isset($_SESSION['email']) || !PHPMailer::validateAddress($_SESSION['email'])) {
            throw new Exception("無法讀取您的電子信箱資訊，請嘗試重新登入。");
        }

        $stmt = $pdo->prepare("SELECT role, message_content, timestamp FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC");
        $stmt->execute([$user_id]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $history_html_for_email = buildChatHistoryForEmail($history, $_SESSION);

        $subject = "【NCUE 獎助學金資訊平台】使用者請求承辦人員協助 (使用者: {$_SESSION['username']})";
        $email_header_content = include '../includes/email_header.php';
        $email_footer_content = include '../includes/email_footer.php';

        $email_main_content = "
            <div style='padding: 20px;'>
                <h3>使用者請求協助</h3>
                <p>
                    <strong>姓名:</strong> " . htmlspecialchars($_SESSION['username']) . "<br>
                    <strong>Email (請直接轉寄此信件):</strong> <a href='mailto:" . htmlspecialchars($_SESSION['email']) . "' style='color: #005A9C;'>" . htmlspecialchars($_SESSION['email']) . "</a>
                </p>
                <hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                <h4>對話紀錄：</h4>
                {$history_html_for_email}
            </div>
        ";

        $email_body = $email_header_content . $email_main_content . $email_footer_content;

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
        $mail->addAddress('act5718@gmail.com', '獎學金承辦人員');
        $mail->addReplyTo($_SESSION['email'], $_SESSION['username']);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $email_body;
        $mail->send();

        $response['message'] = "您的請求已發送給獎學金承辦人員，我們將會盡快以 Email 與您取得聯繫。";
        $response['success'] = true;
    } else {
        throw new Exception("無效的操作。");
    }
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    $response['message'] = "操作失敗：" . $e->getMessage();
    error_log("Chatbot Handler Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
