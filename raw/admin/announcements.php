<?php
// /admin/announcements.php

require_once '../auth_check.php';
require_once '../includes/header.php';
?>

<!-- 套用後台專屬樣式 -->
<script>
    document.body.className = 'admin-page-body';
</script>

<main class="admin-content-full">
    <div class="content-header">
        <h1>管理後台</h1>
    </div>

    <div class="admin-tabs">
        <ul class="nav-tabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="announcements-tab" data-tab-target="#announcements-panel" type="button" role="tab" aria-controls="announcements-panel" aria-selected="true">
                    <i class="fas fa-bullhorn"></i> 公告管理
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="users-tab" data-tab-target="#users-panel" type="button" role="tab" aria-controls="users-panel" aria-selected="false">
                    <i class="fas fa-users-cog"></i> 使用者管理
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="guide-tab" data-tab-target="#guide-panel" type="button" role="tab" aria-controls="guide-panel" aria-selected="false">
                    <i class="fas fa-book-open"></i> 使用說明
                </button>
            </li>
        </ul>

        <div class="tab-content">
            <!-- 面板一：公告管理 -->
            <div class="tab-panel active" id="announcements-panel" role="tabpanel" aria-labelledby="announcements-tab">
                <div class="panel-header">
                    <h2>公告列表</h2>
                    <button id="add-announcement-btn" class="btn-modern primary"><i class="fas fa-plus"></i> 新增公告</button>
                </div>
                <div class="panel-body">
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>標題</th>
                                    <th>分類</th>
                                    <th>申請截止日</th>
                                    <th>狀態</th>
                                    <th>建立者</th>
                                    <th>最後更新</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="admin-announcement-list">
                                <!-- 公告列表由 admin.js 動態載入 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 面板二：使用者管理 -->
            <div class="tab-panel" id="users-panel" role="tabpanel" aria-labelledby="users-tab">
                <div class="panel-header">
                    <h2>使用者列表</h2>
                    <div class="search-container admin-search">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="user-search-input" class="search-input" placeholder="搜尋姓名、學號、信箱...">
                    </div>
                </div>
                <div class="panel-body">
                    <div class="table-container">
                        <table class="admin-table user-table">
                            <thead>
                                <tr>
                                    <th class="col-student-id">學號</th>
                                    <th class="col-username">姓名</th>
                                    <th class="col-email">電子信箱</th>
                                    <th class="col-role">權限</th>
                                    <th class="col-actions">操作</th>
                                </tr>
                            </thead>
                            <tbody id="user-list-body">
                                <!-- 使用者列表將由 JS 動態載入 -->
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-controls" id="user-pagination-controls">
                        <div id="user-pagination-nav"></div>
                    </div>
                </div>
            </div>

            <!-- 面板三：使用說明 -->
            <div class="tab-panel" id="guide-panel" role="tabpanel" aria-labelledby="guide-tab">
                <div class="usage-guide-box">
                    <div class="usage-guide-header">
                        <i class="fas fa-info-circle"></i>
                        <h3>智慧公告發布流程說明</h3>
                    </div>
                    <div class="usage-guide-content">
                        <div class="usage-step">
                            <span class="step-number">1</span>
                            <div>
                                <h5>提供資料來源 (AI 分析)</h5>
                                <p>點擊「新增公告」，在步驟一中提供一個或多個資料來源（PDF、外部網址、文字內容）。提供的資料越完整、越豐富，AI 分析的準確度越高。</p>
                            </div>
                        </div>
                        <div class="usage-step">
                            <span class="step-number">2</span>
                            <div>
                                <h5>審閱與發布</h5>
                                <p>AI 會自動讀取所有來源、生成摘要並填寫右側欄位。您可以在此基礎上進行最終審閱、修改，然後儲存並發布公告。</p>
                            </div>
                        </div>
                        <div class="usage-step">
                            <span class="step-number">3</span>
                            <div>
                                <h5>快速發布 (省略前二步驟，直接發布)</h5>
                                <p>您也可以完全略過 AI 分析流程。直接在步驟三的「公告標題」和「公告摘要」中手動填寫內容，即可啟用儲存按鈕，進行快速發布。</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="admin-actions-grid" style="margin-top: 1.5rem;">
                    <div class="action-card">
                        <i class="fas fa-lightbulb"></i>
                        <h5>使用提醒</h5>
                        <ul>
                            <li><strong>參考資料完整性</strong>：請盡可能上傳所有參考資料來源(包括 PDF、網址、純文字內容)，越多的參考資料，AI 摘要的效果會更好。意即請盡量至獎學金提供者官網下載相關 PDF，並上傳至此平台當成資料源。</li>
                            <li><strong>盡量避免掃描檔</strong>：多模態之 PDF (掃描之非文字檔) 雖然可以正確讀取並生成摘要，但會無法加入 AI 參考資料，請盡可能避免。</li>
                            <li><strong>公告發布原則</strong>：如欲修改公告，建議創建新公告而不要直接修改原公告(需多模態讀取之 PDF 可能會無法正確被引入成 AI 資料源)。</li>
                            <li><strong>錯誤回報</strong>：由於此 AI 摘要的工作流極其複雜，因此難以避免有邏輯錯誤，有錯誤時請務必回報以讓開發者快速解決。</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>


<!-- 公告編輯 MODAL -->
<div id="announcementManageModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <h3 id="modal-title">新增獎學金公告</h3>
            <button id="close-modal-btn" class="close-btn">×</button>
        </div>

        <div class="progress-stepper">
            <div class="step active" id="step-1">
                <div class="step-icon">1</div>
                <div class="step-label">提供來源</div>
            </div>
            <div class="step-connector"></div>
            <div class="step" id="step-2">
                <div class="step-icon">2</div>
                <div class="step-label">AI 分析</div>
            </div>
            <div class="step-connector"></div>
            <div class="step" id="step-3">
                <div class="step-icon">3</div>
                <div class="step-label">審閱儲存</div>
            </div>
        </div>

        <div id="ai-status-text" class="ai-status"></div>

        <div class="modal-body">
            <form id="announcement-form" novalidate>
                <input type="hidden" id="announcement-id" name="announcement_id">
                <input type="hidden" id="full-content" name="full_content">

                <div class="form-main-content">
                    <div class="form-section">
                        <h4 class="form-section-title">步驟一：提供資料來源 (AI 分析用，可選)</h4>
                        <div class="source-selection-group">
                            <label class="checkbox-label"><input type="checkbox" name="source_type[]" value="pdf"> PDF 檔案</label>
                            <label class="checkbox-label"><input type="checkbox" name="source_type[]" value="url"> 外部網址</label>
                            <label class="checkbox-label"><input type="checkbox" name="source_type[]" value="manual"> 文字內容</label>
                        </div>
                        <div id="source-inputs-container">
                            <div class="source-input-wrapper" id="pdf-input-wrapper" style="display: none;">
                                <label for="pdf-files" class="form-label">上傳 PDF 檔案 (可多選)</label>
                                <input type="file" id="pdf-files" class="form-control" accept=".pdf" multiple>
                                <div id="attachment-list-container">
                                    <ul id="new-attachments-list"></ul>
                                    <ul id="existing-attachments-list"></ul>
                                </div>
                            </div>
                            <div class="source-input-wrapper" id="url-input-wrapper" style="display: none;">
                                <label for="external-urls" class="form-label">輸入外部網址 (以換行分隔)</label>
                                <textarea id="external-urls" name="external_urls" class="form-control" rows="3"></textarea>
                            </div>
                            <div class="source-input-wrapper" id="manual-input-wrapper" style="display: none;">
                                <label for="plain-text-input" class="form-label">貼上文字內容</label>
                                <textarea id="plain-text-input" name="manual_text" class="form-control" rows="5"></textarea>
                            </div>
                        </div>
                        <button type="button" id="start-ai-analysis-btn" class="btn-modern accent" disabled> AI 摘要</button>
                    </div>

                    <hr class="form-divider">

                    <div class="form-section">
                        <h4 class="form-section-title">步驟三：審閱與編輯</h4>
                        <div class="form-group">
                            <label for="title" class="form-label">公告標題 (必填)</label>
                            <input type="text" id="title" name="title" class="form-control">
                        </div>
                        <div class="form-group">
                            <div class="label-with-button">
                                <label class="form-label">公告摘要 (必填)</label>
                                <button type="button" id="regenerate-summary-btn" class="btn-modern text" disabled><i class="fas fa-sync-alt"></i> 重新生成摘要</button>
                            </div>
                            <div id="summary-editor-container">
                                <textarea id="summary-editor" name="summary"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <aside class="form-sidebar">
                    <div class="form-group">
                        <label for="is_active" class="form-label">公告狀態</label>
                        <select id="is_active" name="is_active" class="form-control">
                            <option value="0" selected>下架 (草稿)</option>
                            <option value="1">上架</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="category" class="form-label">獎學金分類</label>
                        <select id="category" name="category" class="form-control">
                            <option value="">N/A</option>
                            <option value="A">A: 縣市政府</option>
                            <option value="B">B: 其他公家機關</option>
                            <option value="C">C: 宗親會/指定身分</option>
                            <option value="D">D: 其他民間單位</option>
                            <option value="E">E: 得獎名單</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="application_deadline" class="form-label">申請截止日期</label>
                        <input type="date" id="application_deadline" name="application_deadline" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="announcement_end_date" class="form-label">公告下架日期</label>
                        <input type="date" id="announcement_end_date" name="announcement_end_date" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="target_audience" class="form-label">適用對象</label>
                        <textarea id="target_audience" name="target_audience" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="application_limitations" class="form-label">兼領限制</label>
                        <input type="text" id="application_limitations" name="application_limitations" class="form-control" placeholder="Y, N, 或文字說明">
                    </div>
                    <div class="form-group">
                        <label for="submission_method" class="form-label">送件方式</label>
                        <input type="text" id="submission_method" name="submission_method" class="form-control" placeholder="自行送件、至系生輔組申請...">
                    </div>
                </aside>
            </form>
        </div>

        <div class="modal-footer">
            <button type="button" id="cancel-btn" class="btn-modern secondary">取消</button>
            <button type="button" id="save-announcement-btn" class="btn-modern primary" disabled><i class="fas fa-save"></i> 儲存公告</button>
        </div>
    </div>
</div>

<!-- 寄信 MODAL -->
<div id="sendEmailModal" class="modal-overlay" style="display: none;">
    <div class="modal-container" style="max-width: 600px; height: auto;">
        <div class="modal-header">
            <h3 id="email-modal-title">寄送通知郵件</h3>
            <button id="close-email-modal-btn" class="close-btn">×</button>
        </div>
        <div class="modal-body">
            <form id="send-email-form">
                <input type="hidden" id="email-recipient-id" name="id">
                <div class="form-group">
                    <label>收件人:</label>
                    <p id="email-recipient-info" class="form-control-static"></p>
                </div>
                <div class="form-group">
                    <label for="email-subject" class="form-label">主旨</label>
                    <input type="text" id="email-subject" name="subject" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="email-body" class="form-label">內文</label>
                    <textarea id="email-body" name="body" class="form-control" rows="8" required></textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" id="cancel-email-btn" class="btn-modern secondary">取消</button>
            <button type="button" id="send-email-btn" class="btn-modern primary"><i class="fas fa-paper-plane"></i> 寄送郵件</button>
        </div>
    </div>
</div>

<?php
require_once '../includes/footer.php';
?>