import { useState, useEffect } from 'react'

// 簡化版的 Markdown 渲染器
const MarkdownRenderer = ({ content, className = '' }) => {
	const [renderedHTML, setRenderedHTML] = useState('')

	useEffect(() => {
		const renderMarkdown = (text) => {
			// 處理 Markdown 語法
			let html = text
				// 粗體文字 **text**
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				// 斜體文字 *text*
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				// 行內程式碼 `code`
				.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
				// 連結 [text](url)
				.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
				// 換行
				.replace(/\n/g, '<br />')

			// 處理列表項目 - 先將 * 開頭的行轉換成 li
			const lines = html.split('<br />')
			let inList = false
			let processedLines = []

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim()

				if (line.startsWith('*   ') || line.startsWith('- ')) {
					const listItem = line.replace(/^[*-]\s+/, '')
					if (!inList) {
						processedLines.push('<ul class="list-disc list-inside ml-4 space-y-1">')
						inList = true
					}
					processedLines.push(`<li>${listItem}</li>`)
				} else {
					if (inList) {
						processedLines.push('</ul>')
						inList = false
					}
					if (line) {
						processedLines.push(line)
					}
				}
			}

			if (inList) {
				processedLines.push('</ul>')
			}

			return processedLines.join('<br />')
		}

		setRenderedHTML(renderMarkdown(content))
	}, [content])

	return (
		<div
			className={`prose prose-sm max-w-none ${className}`}
			dangerouslySetInnerHTML={{ __html: renderedHTML }}
		/>
	)
}

export default MarkdownRenderer
