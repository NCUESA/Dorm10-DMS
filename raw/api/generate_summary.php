<?php
// /api/generate_summary.php

header('Content-Type: application/json');
require_once '../auth_check.php';
require_once '../config.php';
require_once __DIR__ . '/../vendor/autoload.php';

$action = $_POST['action'] ?? 'generate';

$full_content_parts = [];
$content_for_ai = [];
$files_for_multimodal = [];

try {
    if ($action === 'regenerate') {
        $full_content = $_POST['full_content'] ?? '';
        if (empty($full_content)) throw new Exception('重新生成需要提供 full_content。');
        $content_for_ai[] = $full_content;
        $full_content_from_sources = $full_content;
    } else {
        // 首次分析
        if (!empty($_FILES['pdf_files']['name'])) {
            foreach ($_FILES['pdf_files']['tmp_name'] as $index => $tmp_name) {
                if (is_uploaded_file($tmp_name)) {
                    $raw_text = '';
                    $original_filename = $_FILES['pdf_files']['name'][$index];
                    $parser = new \Smalot\PdfParser\Parser();
                    try {
                        $text = $parser->parseFile($tmp_name)->getText();
                        if (empty(trim($text))) throw new Exception("PdfParser parsed empty text.");
                        $full_content_parts[] = "--- PDF 內容 ($original_filename) ---\n" . $text;
                        $content_for_ai[] = $text;
                    } catch (Exception $e) {
                        error_log("PdfParser failed for $original_filename. Fallback to multimodal. Error: " . $e->getMessage());
                        $files_for_multimodal[] = ['name' => $original_filename, 'mime_type' => $_FILES['pdf_files']['type'][$index], 'data' => base64_encode(file_get_contents($tmp_name))];
                    }
                }
            }
        }
        $external_urls_string = $_POST['external_urls'] ?? '';
        if (!empty($external_urls_string)) {
            $urls = explode("\n", trim($external_urls_string));
            foreach ($urls as $url) {
                $url = trim($url);
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
                    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
                    $html = curl_exec($ch);
                    curl_close($ch);
                    if ($html) {
                        $text = preg_replace(['/<script\b[^>]*>(.*?)<\/script>/is', '/<style\b[^>]*>(.*?)<\/style>/is'], "", $html);
                        $text = strip_tags($text);
                        $text = trim(preg_replace(['/(\s*[\r\n]\s*)+/', '/[ \t]+/'], ["\n", ' '], $text));
                        $full_content_parts[] = "--- 網址內容 ($url) ---\n" . $text;
                        $content_for_ai[] = $text;
                    }
                }
            }
        }
        $manual_text = trim($_POST['manual_text'] ?? '');
        if (!empty($manual_text)) {
            $full_content_parts[] = "--- 手動輸入內容 ---\n" . $manual_text;
            $content_for_ai[] = $manual_text;
        }
        $full_content_from_sources = implode("\n\n---\n\n", $full_content_parts);
    }

    $text_for_ai_prompt = implode("\n\n---\n\n", $content_for_ai);
    if (empty($text_for_ai_prompt) && empty($files_for_multimodal)) {
        throw new Exception('所有來源皆無法獲取任何有效內容可供 AI 分析。');
    }

    $prompt = "
# 角色 (Persona)
你是一位頂尖的「彰化師範大學獎學金公告分析專家」。你的任務是將一篇關於獎學金的公告，轉換成一段重點突出、視覺清晰的 HTML 公告，並提取結構化資料。你只須關注與「大學部」及「碩士班」學生相關的資訊，並嚴格遵循所有規則。

# 核心任務 (Core Task)
你的任務是根據下方提供的「公告全文」，執行以下兩項任務，並將結果合併在一個**單一的 JSON 物件**中回傳。

## 任務一：提取結構化資料 (JSON Extraction)
提取公告中的關鍵資訊，並以一個嚴格的 JSON 物件格式回傳。

### 欄位規則 (Field Rules)
- **不確定性原則**：若資訊未提及或不明確，**必須**回傳 `null`，**禁止**自行猜测。
- **欄位列表**：
    1. `title` (string | null): 公告的**簡短**標題，必須包含**提供單位**和**獎學金名稱**。例如：「國際崇她社『崇她獎』獎學金」。
    2. `category` (string | null): 根據下方的「代碼定義」從 'A'~'E' 中選擇一個。
    3. `application_deadline` (string | null): **申請截止日期**，格式必須是 `YYYY-MM-DD`。若只提及月份，以該月最後一天為準。若為區間，以**結束日期**為準，備註: 民國年 + 1911 即為西元年。
    4. `target_audience` (string | null): **目標對象**。用一段話簡潔但完整地說明，應包含年級、特殊身份、家庭狀況或成績要求等核心申請條件。
    5. `application_limitations` (string | null): **兼領限制**。若內容明確提及**可以**兼領其他獎學金，回傳 'Y'。若提及**不行**兼領其他獎學金，則回傳 'N'。若完全未提及，則回傳 `null`。
    6. `submission_method` (string | null): **送件方式**。簡要說明最終的送件管道，例如「自行送件申請」、「送至生輔組彙辦」或「線上系統申請」。
    7. `web_content` (string | null): 若來源為網址，回傳網址的**主要文字內容**。若無，則 `null`。

## 任務二：生成 HTML 重點摘要 (HTML Summary Generation)
根據你分析的內容，生成一份專業、條理分明的 HTML 格式重點摘要。

### 內容與結構指導 (Content & Structure Guidance)
- **摘要必須包含以下幾個部分（如果公告中有提及）**：
    1.  **申請資格**: 應包含所有身份、年級、成績、家庭等條件。**建議使用 `<ul>` 列點呈現**。
    2.  **獎助金額**: 應清楚說明不同組別的金額與名額。**強烈建議使用 `<table>` 呈現**。
    3.  **申請期限**: 說明完整的申請起訖時間。
    4.  **應繳文件**: 清楚列出所有需要繳交的文件。**建議使用 `<ul>` 或 `<ol>` 列點呈現**。
    5.  **其他注意事項**: 其他補充說明。
- **表格優先**：當資訊具有「項目-內容」的對應關係時（如：大學部-五萬元），**優先使用 `<table>`**。

### 視覺化與樣式指導 (Visualization & Style Guidance)
- **多色彩重點標記**：請**大量且智慧地**使用以下三種顏色來標記重點：
    - **金額、日期、名額等數字類關鍵字**: `<span style=\"color: #D6334C; font-weight: bold;\">`
    - **身份、成績等申請條件**: `<span style=\"color: #F79420; font-weight: bold;\">`
    - **所有小標題 (如：申請資格、獎助金額)**: `<h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">`
- **標籤限定**：只能使用 `<h4>`, `<ul>`, `<li>`, `<ol>`, `<strong>`, `<p>`, `<br>`, `<span>`, `<table>`, `<tbody>`, `<tr>`, `<td>`。
- `summary` 的內容必須放在 JSON 物件的 `summary` (string) 鍵中。


# 獎助學金代碼定義 (Category Definitions)
- **A**: 各縣市政府獎助學金
- **B**: 縣市政府以外之各級公家機關及公營單位獎助學金
- **C**: 宗親會及民間各項指定身分獎助學金 (指定姓名、籍貫、學系等)
- **D**: 各民間單位：因經濟不利、學業優良或其他無法歸類之獎助學金
- **E**: 純粹的獎學金「得獎名單」公告


# 最終輸出規則 (Final Output Rules)
- **你的回覆必須是、也只能是一個 JSON 物件**。
- **絕對禁止**在 JSON 物件前後包含任何 Markdown 標記 (如 ```json ... ```) 或其他任何解釋性文字。
- 請嚴格模仿下方範例的 JSON 結構和 HTML 風格。

# 輸出格式與範例 (Output Format & Example)
```json
{
  \"title\": \"國際蘭馨交流協會『讓夢想起飛』助學方案\",
  \"category\": \"C\",
  \"application_deadline\": \"2025-07-23\",
  \"target_audience\": \"大學部在學女學生(含大一新生)，歷年平均成績達70分，且全戶所得及財產符合規定者。\",
  \"application_limitations\": \"N\",
  \"submission_method\": \"送件至生輔組或 Email 寄送 PDF 檔\",
  \"web_content\": null,
  \"summary\": \"<h4 style=\\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\\">申請資格</h4><ul><li>國內各大學日間部、進修學士班之<span style=\\\"color: #F79420; font-weight: bold;\\\">在學女學生</span>。</li><li>歷年學業平均成績達 <span style=\\\"color: #F79420; font-weight: bold;\\\">70分</span> 且未受記過處分。</li><li>全戶人均所得未逾當年度最低基本工資。</li><li>全戶存款本金未逾 <span style=\\\"color: #D6334C; font-weight: bold;\\\">10萬元</span>。</li></ul><h4 style=\\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\\">補助金額</h4><p>通過審查者，補助每學期學費至畢業為止。</p><h4 style=\\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\\">申請應繳文件</h4><ol><li>申請書（需黏貼照片並簽名）。</li><li>歷年成績單（新生附高三成績單）。</li><li>全戶含記事戶籍謄本。</li><li>全戶113年所得及財產清單。</li><li>其他佐證資料（如重大傷病卡、身障手冊等）。</li></ol><h4 style=\\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\\">申請期限</h4><p>即日起至 <span style=\\\"color: #D6334C; font-weight: bold;\\\">2025年7月23日</span> 前，將文件送至生輔組或 Email 寄送。</p>\"
}

# 公告全文 (Source Text)
---
";

    $request_parts = [];
    $request_parts[] = ['text' => $prompt];
    if (!empty($text_for_ai_prompt)) {
        $request_parts[] = ['text' => "請分析以下提供的完整文字內容：\n" . $text_for_ai_prompt];
    }
    foreach ($files_for_multimodal as $file) {
        $request_parts[] = ['text' => "也請一併分析這個名為 '{$file['name']}' 的檔案："];
        $request_parts[] = ['inline_data' => ['mime_type' => $file['mime_type'], 'data' => $file['data']]];
    }

    $apiKey = GEMINI_API_KEY;
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;

    $data = ['contents' => [['role' => 'user', 'parts' => $request_parts]], 'generationConfig' => ['response_mime_type' => 'application/json']];
    $options = ['http' => ['header' => "Content-Type: application/json\r\n", 'method' => 'POST', 'content' => json_encode($data), 'ignore_errors' => true]];
    $context  = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);

    $http_status_line = isset($http_response_header[0]) ? $http_response_header[0] : null;

    if ($result === FALSE || is_null($http_status_line) || !str_contains($http_status_line, '200 OK')) {
        $error_details = json_decode($result, true);
        $error_message = $error_details['error']['message'] ?? '無法連線至 AI 服務或請求失敗。';
        error_log("Gemini API Error - Status: " . ($http_status_line ?? 'N/A') . " | Response: " . $result);
        throw new Exception($error_message);
    }

    $api_response = json_decode($result, true);
    $ai_json_string = $api_response['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if (empty($ai_json_string)) throw new Exception('AI 回傳的內容為空。');

    $first_brace = strpos($ai_json_string, '{');
    $last_brace = strrpos($ai_json_string, '}');
    if ($first_brace !== false && $last_brace !== false && $last_brace > $first_brace) {
        $ai_json_string = substr($ai_json_string, $first_brace, $last_brace - $first_brace + 1);
    }

    $ai_data = json_decode($ai_json_string, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Decode Error. Original: " . $ai_json_string);
        throw new Exception('AI 回傳的 JSON 格式不正確。');
    }

    if ($action === 'regenerate') {
        $ai_data['full_content'] = $full_content;
    } else {
        foreach ($files_for_multimodal as $file) {
            $full_content_from_sources .= "\n\n---\n\n--- 多模態檔案內容 ({$file['name']}) ---\n[此內容由 AI 根據檔案視覺內容生成摘要，無純文字原文]";
        }
        $ai_data['full_content'] = $full_content_from_sources;
    }

    $ai_data['summary'] = $ai_data['summary'] ?? '<p>AI 未能生成摘要。</p>';
    unset($ai_data['web_content']);

    echo json_encode(['success' => true, 'message' => 'AI 分析完成。', 'data' => $ai_data]);
} catch (Exception $e) {
    http_response_code(400);
    error_log("Generate Summary Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
