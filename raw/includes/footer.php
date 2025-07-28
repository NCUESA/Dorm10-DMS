<?php
// /includes/footer.php
?>
</main>

<footer>
    <div class="site-footer modern-footer">
        <div class="footer-container">
            <div class="footer-grid">

                <!-- 欄位一：關於平台 -->
                <div class="footer-column">
                    <h5 class="footer-heading">關於平台</h5>
                    <p class="footer-text">
                        An intelligent scholarship platform cored by a Multimodal LLM, dynamically analyzing user-provided sources (PDFs, URLs) to achieve automated parsing, data extraction, and summarization.
                    </p>
                    <div class="footer-tech-stack">
                        <span>LLM powered by <strong>Gemini 2.5 Flash</strong></span>
                    </div>
                </div>

                <!-- 欄位二：相關資源 -->
                <div class="footer-column">
                    <h5 class="footer-heading">相關資源</h5>
                    <ul class="footer-links">
                        <li><i class="fas fa-university footer-icon"></i><a href="https://stuaffweb.ncue.edu.tw/index.php" target="_blank" rel="noopener noreferrer">彰師大 生輔組首頁</a></li>
                        <li><i class="fab fa-facebook-square footer-icon"></i><a href="https://www.facebook.com/ncuestuser" target="_blank" rel="noopener noreferrer">彰師大 生輔組 FB</a></li>
                        <li><i class="fas fa-question-circle footer-icon"></i><a href="mailto:act5718@gmail.com">詢問獎學金相關問題</a></li>
                    </ul>
                </div>

                <!-- 欄位三：平台開發 -->
                <div class="footer-column">
                    <h5 class="footer-heading">平台開發</h5>
                    <ul class="footer-links">
                        <li><span>Developed and Maintained by <b><strong>Tai Ming Chen</strong></b></span></li>
                        <li><i class="fas fa-envelope footer-icon"></i><a href="mailto:3526ming@gmail.com">聯繫開發者</a></li>
                        <li><i class="fas fa-bug footer-icon"></i><a href="https://forms.gle/xV1URm6tHoNzZQ6x9" target="_blank" rel="noopener noreferrer">平台問題回報</a></li>
                    </ul>
                </div>

            </div>

            <div class="footer-bottom">
                <p>© <?= date('Y') ?> <?= htmlspecialchars(SITE_TITLE) ?>. All Rights Reserved.</p>
            </div>
        </div>
    </div>
</footer>

<!-- 前台公告詳細資訊 Modal -->
<div id="announcementDetailModal" class="modal-overlay" style="display: none;">
    <div class="modal-container" style="max-width: 800px; height: auto; max-height: 85vh;">
        <div class="modal-header">
            <h3 id="detail-modal-title">公告詳細資訊</h3>
            <button id="detail-close-modal-btn" class="close-btn">×</button>
        </div>
        <div class="modal-body" id="detail-modal-body">
            <!-- 內容將由 JS 動態載入 -->
        </div>
    </div>
</div>

<!-- 使用者認證 Modal -->
<div id="authModal" class="modal-overlay" style="display: none;">
    <div class="modal-container" style="max-width: 500px; height: auto;">
        <div class="modal-header">
            <h3 class="modal-title" id="authModalLabel"></h3>
            <button id="auth-close-modal-btn" class="close-btn">×</button>
        </div>
        <div class="modal-body">
            <div id="login-form-container" style="display:none;">
                <?php @include __DIR__ . '/../templates/auth_forms/login_form.html'; ?>
            </div>
            <div id="register-form-container" style="display:none;">
                <?php @include __DIR__ . '/../templates/auth_forms/register_form.html'; ?>
            </div>
            <div id="forgot-password-form-container" style="display:none;">
                <?php @include __DIR__ . '/../templates/auth_forms/forgot_password_form.html'; ?>
            </div>
        </div>
    </div>
</div>

<!-- JavaScript Libraries -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.tiny.cloud/1/nmooxqvw80tqofq3zuz8ifrkyd1g9vhwf21c1u39kzz7ta5m/tinymce/7/tinymce.min.js" referrerpolicy="origin"></script>

<?php
$current_page = basename($_SERVER['PHP_SELF']);
$current_dir = basename(dirname($_SERVER['PHP_SELF']));

echo '<script src="' . BASE_URL . 'assets/js/script.js"></script>';

if (!isset($_SESSION['user_id'])) {
    echo '<script src="' . BASE_URL . 'assets/js/auth.js"></script>';
}

if ($current_dir == 'admin') {
    echo '<script src="' . BASE_URL . 'assets/js/admin.js"></script>';
}
?>

</body>

</html>