'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import QuillEditor from './QuillEditor'
import AttachmentUploader from './AttachmentUploader'
import Button from '@/components/ui/Button'

// Toast 與 CreateAnnouncementModal 中相同
const Toast = ({ show, message, type = 'success', onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const icons = {
    success: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }

  return (
    <div className={`fixed top-20 right-4 z-[60] transform transition-all duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className={`flex items-center p-4 rounded-lg border shadow-lg ${bgColors[type]} min-w-[320px] max-w-md`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function UpdateAnnouncementModal({ isOpen, onClose, announcement, refreshAnnouncements }) {
  const [show, setShow] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    status: announcement?.is_active ? '1' : '0',
    category: '',
    application_deadline: '',
    target_audience: '',
    application_limitations: '',
    submission_method: '',
    external_urls: ''
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: announcement?.title || '',
        summary: announcement?.summary || '',
        status: announcement?.is_active ? '1' : '0',
        category: announcement?.category || '',
        application_deadline: announcement?.application_deadline || '',
        target_audience: announcement?.target_audience || '',
        application_limitations: announcement?.application_limitations || '',
        submission_method: announcement?.submission_method || '',
        external_urls: announcement?.external_urls || ''
      })
      setTimeout(() => setShow(true), 50)
    } else {
      setShow(false)
    }
  }, [isOpen, announcement])

  const showToast = (message, type = 'success') => setToast({ show: true, message, type })
  const hideToast = () => setToast(prev => ({ ...prev, show: false }))

  const stripHtmlTags = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').trim()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSummaryChange = useCallback((content) => {
    setFormData(prev => ({ ...prev, summary: content }))
  }, [])

  const isFormValid = formData.title.trim() !== '' && formData.summary.replace(/<[^>]*>?/gm, '').trim() !== ''

  const handleSave = async () => {
    if (!isFormValid) {
      showToast('請填寫所有必填欄位', 'warning')
      return
    }
    setIsSaving(true)
    try {
      const { data: updated, error } = await supabase
        .from('announcements')
        .update({
          title: formData.title,
          summary: formData.summary,
          category: formData.category,
          application_deadline: formData.application_deadline || null,
          target_audience: formData.target_audience,
          application_limitations: formData.application_limitations,
          submission_method: formData.submission_method,
          external_urls: formData.external_urls,
          is_active: formData.status === '1'
        })
        .eq('id', announcement.id)
        .select()
        .single()
      if (error) throw error

      for (const file of attachments) {
        const path = `${updated.id}/${crypto.randomUUID()}-${file.name}`
        const { error: upErr } = await supabase.storage
          .from('attachments')
          .upload(path, file)
        if (upErr) throw upErr
        const { error: insErr } = await supabase.from('attachments').insert({
          announcement_id: updated.id,
          file_name: file.name,
          stored_file_path: path,
          file_size: file.size,
          mime_type: file.type
        })
        if (insErr) throw insErr
      }

      showToast('公告已更新', 'success')
      if (refreshAnnouncements) refreshAnnouncements()
      handleClose()
    } catch (err) {
      console.error('更新失敗:', err)
      showToast(`更新失敗: ${err.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = useCallback(() => {
    if (isSaving) return
    setShow(false)
    setTimeout(() => {
      onClose()
      setAttachments([])
    }, 300)
  }, [isSaving, onClose])

  if (!isOpen) return null

  return (
    <>
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div
        className={`fixed inset-0 bg-black/60 z-50 pt-20 pb-10 px-4 flex justify-center items-start overflow-y-auto transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-modal="true"
        role="dialog"
      >
        <div
          className={`bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col transition-all duration-300 ${show ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
          style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}
        >
          <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800">更新公告</h2>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full disabled:cursor-not-allowed"
            >
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            {isSaving && (
              <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-lg">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="mt-4 text-indigo-700 font-semibold">儲存中...</p>
              </div>
            )}
            <form className="space-y-6" noValidate>
              <fieldset className="p-6 bg-white rounded-lg border shadow-sm">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">公告標題 (必填)</label>
                      <input type="text" id="title" name="title" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.title} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">公告狀態</label>
                      <select id="status" name="status" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.status} onChange={handleChange} disabled={isSaving}>
                        <option value="0">下架 (草稿)</option>
                        <option value="1">上架</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">獎學金分類</label>
                      <select id="category" name="category" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.category} onChange={handleChange} disabled={isSaving}>
                        <option value="">請選擇</option>
                        <option value="A">A: 縣市政府</option>
                        <option value="B">B: 其他公家機關</option>
                        <option value="C">C: 宗親會/指定身分</option>
                        <option value="D">D: 其他民間單位</option>
                        <option value="E">E: 得獎名單</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="application_deadline" className="block text-sm font-semibold text-gray-700 mb-2">申請截止日期</label>
                      <input type="date" id="application_deadline" name="application_deadline" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.application_deadline} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div>
                      <label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-2">送件方式</label>
                      <input type="text" id="submission_method" name="submission_method" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={stripHtmlTags(formData.submission_method)} onChange={(e) => setFormData(prev => ({ ...prev, submission_method: e.target.value }))} disabled={isSaving} />
                    </div>
                    <div>
                      <label htmlFor="external_urls" className="block text-sm font-semibold text-gray-700 mb-2">外部連結</label>
                      <input type="url" id="external_urls" name="external_urls" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.external_urls} onChange={handleChange} disabled={isSaving} placeholder="相關網頁連結..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="target_audience" className="block text-sm font-semibold text-gray-700 mb-2">適用對象</label>
                      <textarea id="target_audience" name="target_audience" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[80px] resize-none" rows={3} value={stripHtmlTags(formData.target_audience)} onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))} disabled={isSaving} placeholder="申請資格或適用對象..." />
                    </div>
                    <div>
                      <label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-2">申請限制</label>
                      <textarea id="application_limitations" name="application_limitations" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[80px] resize-none" rows={3} value={stripHtmlTags(formData.application_limitations)} onChange={(e) => setFormData(prev => ({ ...prev, application_limitations: e.target.value }))} disabled={isSaving} placeholder="申請資格限制或注意事項..." />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-2">公告摘要 (必填)</label>
                    <QuillEditor value={formData.summary} onChange={handleSummaryChange} disabled={isSaving} />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">附件</label>
                    <AttachmentUploader files={attachments} setFiles={setAttachments} disabled={isSaving} />
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
          <div className="p-4 bg-gray-100/80 backdrop-blur-sm border-t flex justify-end space-x-3 flex-shrink-0 rounded-b-2xl">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>取消</Button>
            <Button type="button" variant="primary" onClick={handleSave} loading={isSaving}>保存</Button>
          </div>
        </div>
      </div>
    </>
  )
}
