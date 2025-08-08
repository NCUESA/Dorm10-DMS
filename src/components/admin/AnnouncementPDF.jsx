import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import Html from 'react-pdf-html';
import QRCode from 'qrcode';

Font.register({
    family: 'NotoSansTC',
    fonts: [
        { src: '/fonts/NotoSansTC-Regular.ttf' },
        { src: '/fonts/NotoSansTC-Bold.ttf', fontWeight: 'bold' },
    ],
});

// --- 全局樣式定義 ---
const colors = {
    primary: '#1E40AF',
    text: '#1F2937',
    muted: '#6B7280',
    accent: '#F59E0B',
    background: 'transparent',
    white: '#FFFFFF',
    footer: '#111827',
};

const styles = StyleSheet.create({
    page: {
        fontFamily: 'NotoSansTC',
        fontSize: 10,
        paddingTop: 40,
        paddingBottom: 70,
        paddingHorizontal: 40,
        lineHeight: 1.6,
        backgroundColor: colors.white,
        color: colors.text,
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
    },

    watermarkImage: {
        width: 400,
        height: 400,
        opacity: 0.08,
    },

    watermarkText: {
        marginTop: 30,
        fontSize: 50,
        fontWeight: 'bold',
        color: colors.muted,
        opacity: 0.08,
    },
    header: {
        position: 'absolute',
        top: 15,
        left: 40,
        fontSize: 9,
        color: colors.muted,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 55,
        backgroundColor: colors.footer,
        color: '#A1A1AA',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        fontSize: 8,
    },
    footerColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    footerLink: {
        color: '#E4E4E7',
        textDecoration: 'none',
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 8,
        bottom: 60,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: colors.muted,
        zIndex: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 1.2,
    },
    mainContent: {
        display: 'flex',
        flexDirection: 'row',
        gap: 25,
    },
    leftColumn: {
        width: '32%',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
    },
    rightColumn: {
        width: '68%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    section: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 6,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    infoTextLabel: {
        fontSize: 9,
        color: colors.muted,
        marginBottom: 2,
    },
    infoTextValue: {
        fontSize: 10,
        color: colors.text,
        fontWeight: 'bold',
    },
    qrCodeImage: {
        width: 100,
        height: 100,
        alignSelf: 'center',
    },
    urlText: {
        fontSize: 8,
        color: colors.muted,
        textAlign: 'center',
        marginTop: 5,
        textDecoration: 'none',
    },
    quillWrapper: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 6,
    },
});

const htmlStyles = StyleSheet.create({
    p: { margin: 0, marginBottom: 4, fontSize: 10, lineHeight: 1.5 },
    ul: { paddingLeft: 10, margin: 0 },
    ol: { paddingLeft: 10, margin: 0 },
    li: { marginBottom: 4, fontSize: 10 },
    strong: { fontWeight: 'bold' },
    b: { fontWeight: 'bold' },
    u: { textDecoration: 'underline' },
    i: { fontStyle: 'italic' },
    h4: { fontSize: 11, fontWeight: 'bold', color: colors.primary, margin: 0 },
    span: {},
    table: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        marginTop: 10,
        marginBottom: 10,
    },
    thead: {
        backgroundColor: '#F3F4F6',
        fontWeight: 'bold',
    },
    tbody: {},
    tr: {
        display: 'flex',
        flexDirection: 'row',
    },
    th: {
        flex: 1,
        padding: 6,
        fontSize: 10,
        fontWeight: 'bold',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.text,
    },
    td: {
        flex: 1,
        padding: 6,
        fontSize: 10,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.text,
    },
});

const breakTextForAllChars = (text, maxLength = 27) => {
    if (typeof text !== 'string') return text;
    const regex = new RegExp(`(.{${maxLength}})`, 'g');
    return text.replace(regex, '$1\u200B');
};

const sanitizeHtmlForPdf = (htmlString) => {
    if (!htmlString) return '';
    const blocklist = ['margin', 'padding', 'width', 'height', 'display', 'position', 'left', 'top', 'right', 'bottom'];
    return htmlString.replace(/style="([^"]*)"/g, (match, styleContent) => {
        const cleanedStyles = styleContent
            .split(';')
            .filter(styleRule => {
                if (!styleRule.trim()) return false;
                const property = styleRule.split(':')[0].trim();
                return !blocklist.includes(property);
            })
            .join(';');
        if (!cleanedStyles) return '';
        return `style="${cleanedStyles}"`;
    });
};

const breakWordsInHtml = (htmlString) => {
    if (!htmlString) return '';
    return htmlString.replace(/>([^<]+)</g, (match, textContent) => {
        return `>${breakTextForAllChars(textContent)}<`;
    });
};

const convertEmToPt = (htmlString) => {
    if (!htmlString) return '';
    const regex = /(margin-(?:top|bottom)):\s*([\d.]+)(em)/g;

    return htmlString.replace(regex, (match, property, value) => {
        const emValue = parseFloat(value);
        const h4FontSize = 11;
        const ptValue = Math.round(emValue * h4FontSize);
        return `${property}: ${ptValue}`;
    });
};


const AnnouncementPDF = ({ announcement }) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const homepageUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scholarship.ncuesa.org.tw';
    const announcementUrl = `${homepageUrl}/?announcement_id=${announcement.id}`;

    useEffect(() => {
        const generateQRCode = async () => {
            try {
                const dataUrl = await QRCode.toDataURL(announcementUrl, { errorCorrectionLevel: 'H', margin: 1, width: 256 });
                setQrCodeDataUrl(dataUrl);
            } catch (err) { console.error('Failed to generate QR code', err); }
        };
        generateQRCode();
    }, [announcementUrl]);

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '未指定';

    const processHtmlContent = (html) => {
        if (!html) return html;
        const sanitized = sanitizeHtmlForPdf(html);
        const broken = breakWordsInHtml(sanitized);
        const ptConverted = convertEmToPt(broken);
        return ptConverted;
    };

    const finalSummary = processHtmlContent(announcement.summary);
    const finalTargetAudience = processHtmlContent(announcement.target_audience);

    return (
        <Document title={announcement.title}>
            <Page size="A4" style={styles.page} wrap>
                <Text style={styles.header} fixed>此文件下載於: {new Date().toLocaleString('zh-TW')}</Text>

                <View style={styles.footer} fixed>
                    <View style={styles.footerColumn}>
                        <Text>聯繫 獎學金承辦人員: <Link src="mailto:act5718@gmail.com" style={styles.footerLink}>何淑芬 (act5718@gmail.com)</Link></Text>
                        <Text>聯繫 系統開發者: <Link src="mailto:3526ming@gmail.com" style={styles.footerLink}>Tai Ming Chen (3526ming@gmail.com)</Link></Text>
                    </View>
                    <View style={styles.footerColumn}>
                        <Link src={homepageUrl} style={styles.footerLink}>前往彰師校外獎學金資訊平台</Link>
                        <Text>版權所有 © {new Date().getFullYear()} 彰師校外獎學金資訊平台</Text>
                    </View>
                </View>

                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />

                <View style={styles.watermarkContainer} fixed>
                    <Image
                        style={styles.watermarkImage}
                        src={'/logo.png'}
                    />
                    <Text style={styles.watermarkText}>
                        彰師校外獎學金資訊平台
                    </Text>
                </View>

                {/* --- 渲染可自動換頁的主內容 --- */}
                <Text style={styles.title}>{breakTextForAllChars(announcement.title || '公告詳情', 20)}</Text>

                <View style={styles.mainContent}>
                    <View style={styles.leftColumn}>
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionTitle}>公告資訊</Text>
                            <Text style={styles.infoTextLabel}>公告資料庫 ID</Text>
                            <Text style={styles.infoTextValue}>{breakTextForAllChars(announcement.id, 23)}</Text>
                            <Text style={{ ...styles.infoTextLabel, marginTop: 8 }}>最近編輯日期</Text>
                            <Text style={styles.infoTextValue}>{new Date(announcement.updated_at).toLocaleString('zh-TW')}</Text>
                        </View>
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionTitle}>公告日程</Text>
                            <Text style={styles.infoTextLabel}>申請開始日</Text>
                            <Text style={{ ...styles.infoTextValue, color: colors.primary }}>{formatDate(announcement.application_start_date)}</Text>
                            <Text style={{ ...styles.infoTextLabel, marginTop: 8 }}>申請截止日</Text>
                            <Text style={{ ...styles.infoTextValue, color: colors.primary }}>{formatDate(announcement.application_end_date)}</Text>
                        </View>
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionTitle}>申請辦法</Text>
                            <Text style={styles.infoTextLabel}>申請限制</Text>
                            <Text style={styles.infoTextValue}>{announcement.application_limitations || '未指定'}</Text>
                            <Text style={{ ...styles.infoTextLabel, marginTop: 8 }}>送件方式</Text>
                            <Text style={styles.infoTextValue}>{breakTextForAllChars(announcement.submission_method || '未指定', 13)}</Text>
                        </View>
                        <View style={styles.section} wrap={false}>
                            {qrCodeDataUrl && <Image style={styles.qrCodeImage} src={qrCodeDataUrl} />}
                            <Link src={announcementUrl} style={styles.urlText}>掃描或點擊以查看線上公告</Link>
                        </View>
                    </View>
                    <View style={styles.rightColumn}>
                        <View style={styles.quillWrapper}>
                            <Text style={styles.sectionTitle}>適用對象</Text>
                            <Html stylesheet={htmlStyles}>{finalTargetAudience || '<p>未指定</p>'}</Html>
                        </View>
                        <View style={styles.quillWrapper}>
                            <Text style={styles.sectionTitle}>公告摘要</Text>
                            <Html stylesheet={htmlStyles}>{finalSummary || '<p>無詳細內容</p>'}</Html>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default AnnouncementPDF;