import React from 'react';

// --- Helper Functions & Components ---

const htmlToPlainText = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/(\r\n|\n|\r)/gm, "").replace(/\s+/g, ' ').trim();
};

// **MODIFIED**: A robust, iterative parser for HTML spans. This is the core of the fix.
const htmlToFlexSpans = (html) => {
    if (!html) return [{ type: 'span', text: '' }];

    const spans = [];
    // Regex to find <span> tags with a color style. It captures the color and the content.
    const spanRegex = /<span[^>]*style="[^"]*color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/span>/gs;
    let lastIndex = 0;
    let match;

    while ((match = spanRegex.exec(html)) !== null) {
        // 1. Add any plain text that appeared before this styled span.
        if (match.index > lastIndex) {
            const text = htmlToPlainText(html.substring(lastIndex, match.index));
            if (text) spans.push({ type: 'span', text: text });
        }
        
        // 2. Add the styled span itself.
        const color = match[1].trim();
        const content = htmlToPlainText(match[2]);
        if (content) {
            spans.push({
                type: 'span',
                text: content,
                color: color,
                weight: 'bold', // Assume colored text is always bold.
            });
        }
        
        // 3. Update the position for the next search.
        lastIndex = match.index + match[0].length;
    }

    // 4. Add any remaining plain text after the last styled span.
    if (lastIndex < html.length) {
        const text = htmlToPlainText(html.substring(lastIndex));
        if (text) spans.push({ type: 'span', text: text });
    }

    // If the HTML had no spans at all, return the plain text version.
    return spans.length > 0 ? spans : [{ type: 'span', text: htmlToPlainText(html) }];
};


// **MODIFIED**: This function now correctly passes the full inner HTML to the span parser.
const htmlToFlexComponents = (html) => {
    if (!html) return [];

    const components = [];
    const elementRegex = /<(h4|p|ul|ol|table)[\s\S]*?>(.*?)<\/\1>/gs;
    let lastIndex = 0;
    let match;

    while ((match = elementRegex.exec(html)) !== null) {
        if (match.index > lastIndex) {
            const textContent = html.substring(lastIndex, match.index);
            if (htmlToPlainText(textContent)) {
                components.push({ type: 'text', contents: htmlToFlexSpans(textContent), wrap: true, size: 'sm', margin: 'md' });
            }
        }
        
        const [fullMatch, tagName, innerHtml] = match;
        const plainText = (text) => text.replace(/<[^>]*>?/gm, '').trim();

        switch (tagName) {
            case 'h4':
                components.push({ type: 'text', text: plainText(innerHtml), weight: 'bold', size: 'md', margin: 'lg', color: '#6D28D9' });
                break;
            case 'p':
                // Pass the inner HTML to the span parser
                components.push({ type: 'text', contents: htmlToFlexSpans(innerHtml), wrap: true, size: 'sm', margin: 'md' });
                break;
            case 'ul':
            case 'ol':
                const items = innerHtml.match(/<li.*?>(.*?)<\/li>/gs) || [];
                items.forEach(item => {
                    components.push({
                        type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'xs',
                        contents: [
                            { type: 'text', text: '•', flex: 0, color: '#9ca3af', margin: 'xs' },
                            // Pass the inner HTML of the <li> to the span parser
                            { type: 'text', contents: htmlToFlexSpans(item), wrap: true, size: 'sm', flex: 1 }
                        ]
                    });
                });
                break;
            case 'table':
                const rows = innerHtml.match(/<tr.*?>(.*?)<\/tr>/gs) || [];
                rows.forEach(row => {
                    const cells = row.match(/<td.*?>(.*?)<\/td>/gs) || [];
                    if (cells.length > 0) {
                        components.push({
                            type: 'box', layout: 'horizontal', margin: 'sm', spacing: 'md',
                            contents: cells.map(cell => ({
                                type: 'text', 
                                // Pass the inner HTML of the <td> to the span parser
                                contents: htmlToFlexSpans(cell), 
                                wrap: true, 
                                size: 'sm', 
                                flex: 1, 
                                margin: 'xs'
                            }))
                        });
                    }
                });
                break;
            default: break;
        }
        lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < html.length) {
        const textContent = html.substring(lastIndex);
        if (htmlToPlainText(textContent)) {
            components.push({ type: 'text', contents: htmlToFlexSpans(textContent), wrap: true, size: 'sm', margin: 'md' });
        }
    }

    return components;
};


const buildFlexMessageForPreview = (announcement) => {
    if (!announcement) return null;

    const startDate = announcement.application_start_date ? new Date(announcement.application_start_date).toLocaleDateString('en-CA') : null;
    const endDate = announcement.application_end_date ? new Date(announcement.application_end_date).toLocaleDateString('en-CA') : '無期限';
    const dateString = startDate ? `${startDate} ~ ${endDate}` : endDate;
    const categoryText = `分類 ${announcement.category || '未分類'}`;
    
    const summaryComponents = htmlToFlexComponents(announcement.summary);
    const audienceSpans = htmlToFlexSpans(announcement.target_audience);

    return {
        type: 'bubble',
        header: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '20px',
            backgroundColor: '#A78BFA',
            spacing: 'md',
            contents: [
                { type: 'text', text: categoryText, color: '#EDE9FE', size: 'sm' },
                { type: 'text', text: announcement.title || '無標題', color: '#FFFFFF', size: 'lg', weight: 'bold', wrap: true },
            ],
        },
        body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '20px',
            spacing: 'xl',
            contents: [
                ...summaryComponents,
                { type: 'separator', margin: 'xl' },
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'lg',
                    spacing: 'md',
                    contents: [
                        {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                                { type: 'text', text: '申請期間', size: 'sm', color: '#94a3b8', flex: 0, weight: 'bold' },
                                { type: 'text', text: dateString, size: 'sm', color: '#334155', align: 'end', wrap: true },
                            ],
                        },
                        {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                                { type: 'text', text: '適用對象', size: 'sm', color: '#94a3b8', flex: 0, weight: 'bold' },
                                { type: 'text', size: 'sm', color: '#334155', align: 'end', wrap: true, contents: audienceSpans },
                            ],
                        },
                    ],
                },
            ],
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '20px',
            backgroundColor: '#f8fafc',
            contents: [
                {
                    type: 'button',
                    style: 'primary',
                    color: '#8B5CF6',
                    action: { type: 'uri', label: '查看更多資訊', uri: '#' },
                },
            ],
        },
    };
};

// --- Flex Message Rendering Components ---
const mapStyleToProps = (props = {}) => {
    const styles = [];
    if (props.size) {
        const sizeMap = { 'xxs': 'text-[10px]', 'xs': 'text-xs', 'sm': 'text-sm', 'md': 'text-base', 'lg': 'text-lg', 'xl': 'text-xl', 'xxl': 'text-2xl' };
        styles.push(sizeMap[props.size] || 'text-sm');
    }
    if (props.weight === 'bold') styles.push('font-bold');
    if (props.color) styles.push(`[color:${props.color}]`);
    if (props.align) {
        const alignMap = { 'start': 'text-left', 'center': 'text-center', 'end': 'text-right' };
        styles.push(alignMap[props.align]);
    }
    if (props.margin) {
        const marginMap = { 'none': 'mt-0', 'xs': 'mt-1', 'sm': 'mt-2', 'md': 'mt-4', 'lg': 'mt-6', 'xl': 'mt-8' };
        styles.push(marginMap[props.margin]);
    }
    if (props.flex === 0) styles.push('flex-initial');
    else if (props.flex) styles.push(`flex-[${props.flex}]`);
    else styles.push('flex-1');
    return styles.join(' ');
};

const FlexText = ({ component }) => {
    if (component.contents && Array.isArray(component.contents)) {
        return (
            <div className={`${mapStyleToProps(component)} ${component.wrap ? 'whitespace-pre-wrap break-words' : 'leading-snug'}`}>
                {component.contents.map((span, index) => (
                    <span key={index} className={`${mapStyleToProps(span)}`}>{span.text}</span>
                ))}
            </div>
        );
    }
    return (
        <p className={`${mapStyleToProps(component)} ${component.wrap ? 'whitespace-pre-wrap break-words' : 'leading-snug'}`}>
            {component.text}
        </p>
    );
};

const FlexButton = ({ component }) => (
    <div className={`w-full rounded-lg text-center py-3 px-3 font-bold text-white ${mapStyleToProps(component)}`} style={{ backgroundColor: component.color || '#8B5CF6' }}>
        {component.action.label}
    </div>
);

const FlexSeparator = ({ component }) => (
    <div className={`w-full h-px bg-gray-200/80 ${mapStyleToProps(component)}`}></div>
);

const FlexContent = ({ component }) => {
    if (!component) return null;
    switch (component.type) {
        case 'box': return <FlexBox box={component} />;
        case 'text': return <FlexText component={component} />;
        case 'button': return <FlexButton component={component} />;
        case 'separator': return <FlexSeparator component={component} />;
        default: return null;
    }
};

const FlexBox = ({ box }) => {
    const layoutMap = { vertical: 'flex-col', horizontal: 'flex-row items-center', baseline: 'flex-row items-baseline' };
    const spacingMap = { 'xs': 'gap-1', 'sm': 'gap-2', 'md': 'gap-4', 'lg': 'gap-6', 'xl': 'gap-8' };
    const paddingStyle = box.paddingAll ? { padding: box.paddingAll } : {};
    
    return (
        <div className={`flex ${layoutMap[box.layout] || 'flex-col'} ${spacingMap[box.spacing] || ''} ${mapStyleToProps(box)} w-full`} style={{ backgroundColor: box.backgroundColor, ...paddingStyle }}>
            {box.contents.map((content, index) => (
                <FlexContent key={index} component={content} />
            ))}
        </div>
    );
};

const FlexMessagePreview = ({ bubble }) => {
    if (!bubble) return <div className="text-gray-500 text-center p-4">無法產生預覽</div>;
    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl w-full max-w-sm overflow-hidden shadow-lg border border-gray-200/30">
            {bubble.header && <FlexBox box={bubble.header} />}
            {bubble.body && <FlexBox box={bubble.body} />}
            {bubble.footer && <FlexBox box={bubble.footer} />}
        </div>
    );
};

// --- Main Preview Component ---
const LinePreview = ({ announcement }) => {
    const flexMessageBubble = buildFlexMessageForPreview(announcement);

    return (
        <div className="flex justify-center items-center h-full w-full p-4 font-sans">
            <FlexMessagePreview bubble={flexMessageBubble} />
        </div>
    );
};

export default LinePreview;