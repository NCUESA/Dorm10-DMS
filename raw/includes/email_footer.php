<?php
// /includes/email_footer.php

$footerStyle = "background-color: #f1f5f9; color: #64748b; padding: 25px 30px; text-align: center; font-size: 13px; border-top: 1px solid #e2e8f0;";
$linkStyle = "color: #005A9C; text-decoration: none; font-weight: 500;";

ob_start();
?>
                        </td>
                    </tr>
                    <!-- 郵件頁尾 -->
                    <tr>
                        <td style="<?= $footerStyle ?>">
                            <p style="margin: 0 0 12px 0;">此為系統自動寄送之郵件，請勿直接回覆。</p>
                            <p style="margin: 0 0 10px 0;">
                                如需進一步協助，請聯繫獎學金承辦人員：
                                <a href="mailto:act5718@gmail.com" style="<?= $linkStyle ?>">act5718@gmail.com</a>
                            </p>
                            <p style="margin: 0 0 10px 0;">
                                <strong>NNCUE 獎助學金資訊平台</strong> | <a href="https://scholarship.ncuesa.org.tw/" style="<?= $linkStyle ?>" target="_blank" >前往平台</a>
                            </p>
                            <p style="margin: 0;">
                                © <?= date('Y') ?> <?= htmlspecialchars(SITE_TITLE) ?>. All Rights Reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
<?php
return ob_get_clean();