<?php
// /includes/email_header.php

$bodyStyle = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0;";
$backgroundTableStyle = "width: 100%;";
$backgroundCellStyle = "padding: 20px 0;";
$wrapperStyle = "width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;";
$headerStyle = "background-color: #005A9C; background-image: linear-gradient(to bottom right, #00A6D6, #005A9C); color: #ffffff; padding: 35px;"; 
$contentStyle = "padding: 35px 40px; line-height: 1.7; color: #343A40;";

ob_start();
?>

<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($subject ?? SITE_TITLE) ?></title>
</head>
<body style="<?= $bodyStyle ?>">
    <table style="<?= $backgroundTableStyle ?>" border="0" cellpadding="0" cellspacing="0">
        <tr>
            <td style="<?= $backgroundCellStyle ?>" align="center">
                <table style="<?= $wrapperStyle ?>" align="center" border="0" cellpadding="0" cellspacing="0">
                    <!-- 郵件頁首 -->
                    <tr>
                        <td style="<?= $headerStyle ?>" align="center">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px;">
                                <?= htmlspecialchars(SITE_TITLE) ?>
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="<?= $contentStyle ?>">

<?php
return ob_get_clean();