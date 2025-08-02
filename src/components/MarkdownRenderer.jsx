import { useState, useEffect } from 'react'

// 改進版的 Markdown 渲染器，支援更多格式
const MarkdownRenderer = ({ content, className = '' }) => {
	const [renderedHTML, setRenderedHTML] = useState('')

	useEffect(() => {
		const renderMarkdown = (text) => {
			if (!text) return ''
			
			// 處理 Markdown 語法
			let html = text
				// 標題 ## Title
				.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
				.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-blue-700 mt-6 mb-3">$1</h2>')
				.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
				// 粗體文字 **text**
				.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
				// 斜體文字 *text*
				.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
				// 行內程式碼 `code`
				.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
				// 連結 [text](url)
				.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">$1 <svg class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>')

			// 處理表格
			html = renderTables(html)
			
			// 處理列表和段落
			html = renderListsAndParagraphs(html)

			// 處理水平線
			html = html.replace(/^---$/gm, '<hr class="my-4 border-gray-300" />')
			
			// 處理免責聲明樣式的內容
			html = html.replace(/\*(.*?)\*/g, '<div class="ai-disclaimer">$1</div>')

			return html
		}

		const renderTables = (html) => {
			// 檢測 Markdown 表格格式
			const tableRegex = /^(\|.+\|)\n(\|[\s\-\|]+\|)\n((?:\|.+\|\n?)+)/gm
			
			return html.replace(tableRegex, (match, headerRow, separatorRow, bodyRows) => {
				// 解析表頭
				const headers = headerRow.split('|').slice(1, -1).map(h => h.trim())
				
				// 解析表格內容
				const rows = bodyRows.trim().split('\n').map(row => 
					row.split('|').slice(1, -1).map(cell => cell.trim())
				)
				
				let tableHTML = '<table class="w-full border-collapse border border-gray-300 text-sm my-4">'
				
				// 表頭
				tableHTML += '<thead class="bg-gray-50"><tr>'
				headers.forEach(header => {
					tableHTML += `<th class="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">${header}</th>`
				})
				tableHTML += '</tr></thead>'
				
				// 表格內容
				tableHTML += '<tbody>'
				rows.forEach(row => {
					tableHTML += '<tr class="hover:bg-gray-50">'
					row.forEach(cell => {
						tableHTML += `<td class="border border-gray-300 px-3 py-2 text-gray-800">${cell}</td>`
					})
					tableHTML += '</tr>'
				})
				tableHTML += '</tbody></table>'
				
				return tableHTML
			})
		}

		const renderListsAndParagraphs = (html) => {
			const lines = html.split('\n')
			let processedLines = []
			let inList = false
			let inParagraph = false

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim()

				// 跳過已處理的HTML標籤行
				if (line.match(/^<(h[1-6]|table|hr)/)) {
					if (inList) {
						processedLines.push('</ul>')
						inList = false
					}
					if (inParagraph) {
						processedLines.push('</p>')
						inParagraph = false
					}
					processedLines.push(line)
					continue
				}

				// 處理列表
				if (line.startsWith('- ') || line.startsWith('* ')) {
					if (inParagraph) {
						processedLines.push('</p>')
						inParagraph = false
					}
					
					const listItem = line.replace(/^[*-]\s+/, '')
					if (!inList) {
						processedLines.push('<ul class="list-disc list-inside ml-4 space-y-1 my-2">')
						inList = true
					}
					processedLines.push(`<li class="text-gray-800">${listItem}</li>`)
				} 
				// 處理數字列表
				else if (line.match(/^\d+\.\s/)) {
					if (inParagraph) {
						processedLines.push('</p>')
						inParagraph = false
					}
					
					const listItem = line.replace(/^\d+\.\s/, '')
					if (!inList) {
						processedLines.push('<ol class="list-decimal list-inside ml-4 space-y-1 my-2">')
						inList = true
					}
					processedLines.push(`<li class="text-gray-800">${listItem}</li>`)
				}
				// 處理段落
				else if (line && !line.match(/^<\/?(ul|ol|li|table|thead|tbody|tr|td|th|h[1-6])/)) {
					if (inList) {
						processedLines.push(inList ? '</ul>' : '</ol>')
						inList = false
					}
					
					if (!inParagraph) {
						processedLines.push('<p class="text-gray-800 my-2 leading-relaxed">')
						inParagraph = true
					}
					processedLines.push(line)
				}
				// 空行
				else if (!line) {
					if (inList) {
						processedLines.push('</ul>')
						inList = false
					}
					if (inParagraph) {
						processedLines.push('</p>')
						inParagraph = false
					}
				}
			}

			// 關閉未關閉的標籤
			if (inList) {
				processedLines.push('</ul>')
			}
			if (inParagraph) {
				processedLines.push('</p>')
			}

			return processedLines.join('\n')
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
