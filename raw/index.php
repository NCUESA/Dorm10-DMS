<?php
// /index.php

require_once 'includes/header.php';

// --- 預設的排序和篩選參數 ---
$sort_by = 'application_deadline';
$sort_order = 'desc';
$status_filter = 'applying';
$search_query = '';

function get_sort_icon($column, $current_sort_by, $current_sort_order)
{
    if ($column === $current_sort_by) {
        return $current_sort_order === 'asc' ? ' <i class="fas fa-sort-up"></i>' : ' <i class="fas fa-sort-down"></i>';
    }
    return '';
}

// 產生排序用的 URL
function get_sort_url($column)
{
    return "?sort_by={$column}&sort_order=asc";
}

?>

<div class="scholarship-page-container">

    <!-- 區塊一：獎助學金代碼定義 -->
    <div class="category-definition-box">
        <h3 class="category-title">獎助學金代碼定義</h3>
        <ul class="category-list">
            <li><strong>A：</strong>各縣市政府獎助學金</li>
            <li><strong>B：</strong>縣市政府以外之各級公家機關及公營單位獎助學金</li>
            <li><strong>C：</strong>宗親會及民間各項指定身分獎助學金 (姓名、籍貫、限定學系或其他指定身分)</li>
            <li><strong>D：</strong>各民間單位：經濟不利、學業優良或其他無法歸類之獎助學金</li>
            <li><strong>E：</strong>獎學金得獎名單公告</li>
        </ul>
    </div>

    <!-- 區塊二：搜尋與篩選控制項 -->
    <div class="filter-controls">
        <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="search-input" class="search-input" placeholder="搜尋公告標題、摘要...">
        </div>
        <div class="status-filters">
            <button class="filter-btn active" data-filter="applying">開放申請中</button>
            <button class="filter-btn" data-filter="all">全部</button>
            <button class="filter-btn" data-filter="expired">已逾期</button>
        </div>
    </div>

    <!-- 獎學金列表與分頁容器 -->
    <div class="list-pagination-wrapper">
        <div class="scholarship-list-wrapper">
            <table class="scholarship-list-table">
                <thead>
                    <tr>
                        <th class="col-info">
                            <a href="#" data-sort="title">獎助學金資料</a>
                        </th>
                        <th class="col-target-audience">
                            <a href="#" data-sort="target_audience">適用對象</a>
                        </th>
                        <th class="col-limitations">
                            <a href="#" data-sort="category">兼領限制</a>
                        </th>
                        <th class="col-deadline">
                            <a href="#" data-sort="application_deadline">申請期限 / 送件方式</a>
                        </th>
                    </tr>
                </thead>
                <tbody id="announcement-list-body">
                    <!-- 內容將由 JS 動態生成 -->
                </tbody>
            </table>
        </div>

        <!-- 分頁控制項 -->
        <div class="pagination-controls">
            <div class="limit-selector">
                <span>每頁顯示</span>
                <select id="limit-select" class="form-control" style="width: auto;">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                </select>
                <span>筆</span>
            </div>
            <nav id="pagination-nav" aria-label="Page navigation"></nav>
        </div>
    </div>
</div>

<?php
require_once 'includes/footer.php';
?>