import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

// 創建郵件傳輸器
const transporter = nodemailer.createTransporter({
  host: 'ncuesanas.ncue.edu.tw',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'ncuesu',
    pass: 'Ncuesa23!'
  },
  tls: {
    rejectUnauthorized: false // 允許自簽名證書
  }
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      userEmail, 
      userName, 
      urgency, 
      problemType, 
      description, 
      conversationHistory 
    } = body

    // 驗證必要欄位
    if (!userEmail || !urgency || !problemType || !description) {
      return NextResponse.json(
        { error: '請填寫所有必要欄位' },
        { status: 400 }
      )
    }

    // 格式化對話歷史
    const formatConversationHistory = (history) => {
      if (!history || history.length === 0) {
        return '無對話記錄'
      }
      
      return history.map((msg, index) => {
        const role = msg.role === 'user' ? '使用者' : 'AI助理'
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-TW') : '未知時間'
        return `${index + 1}. [${timestamp}] ${role}: ${msg.content}`
      }).join('\n\n')
    }

    // 準備郵件內容
    const emailContent = `
【NCUE 獎學金平台 - 真人支援請求】

使用者資訊：
- 姓名：${userName || '未提供'}
- Email：${userEmail}
- 請求時間：${new Date().toLocaleString('zh-TW')}

問題資訊：
- 緊急程度：${urgency}
- 問題類型：${problemType}
- 問題描述：
${description}

對話歷史記錄：
${formatConversationHistory(conversationHistory)}

---
此郵件由 NCUE 獎學金資訊整合平台自動發送
系統時間：${new Date().toISOString()}
`

    // 發送郵件
    const mailOptions = {
      from: '"NCUE 獎學金平台" <noreply@ncuesa.org.tw>',
      to: userEmail,
      cc: 'admin@ncuesa.org.tw', // 副本給管理員
      subject: `【NCUE獎學金】真人支援請求 - ${problemType} (${urgency})`,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    }

    const result = await transporter.sendMail(mailOptions)
    
    console.log('郵件發送成功:', result.messageId)

    return NextResponse.json({
      success: true,
      message: '支援請求已發送成功！我們將盡快透過 Email 與您聯繫。',
      messageId: result.messageId
    })

  } catch (error) {
    console.error('郵件發送失敗:', error)
    
    return NextResponse.json(
      { 
        error: '郵件發送失敗，請稍後再試或直接聯繫承辦人員', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
