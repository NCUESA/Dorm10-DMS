'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

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
    )
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200'
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

export default function DeleteAnnouncementModal({ isOpen, onClose, announcementId, refreshAnnouncements }) {
  const [show, setShow] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 50)
    } else {
      setShow(false)
    }
  }, [isOpen])

  const showToast = (message, type = 'success') => setToast({ show: true, message, type })
  const hideToast = () => setToast(prev => ({ ...prev, show: false }))

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
      if (error) throw error
      showToast('公告已刪除', 'success')
      if (refreshAnnouncements) refreshAnnouncements()
      handleClose()
    } catch (err) {
      console.error('刪除失敗:', err)
      showToast(`刪除失敗: ${err.message}`, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = useCallback(() => {
    if (isDeleting) return
    setShow(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [isDeleting, onClose])

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
          className={`bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col transition-all duration-300 ${show ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
          style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}
        >
          <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800">刪除公告</h2>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full disabled:cursor-not-allowed"
            >
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-gray-700">確定要刪除這則公告嗎？此操作無法復原。</p>
          </div>
          <div className="p-4 bg-gray-100/80 backdrop-blur-sm border-t flex justify-end space-x-3 flex-shrink-0 rounded-b-2xl">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isDeleting}>取消</Button>
            <Button type="button" variant="danger" onClick={handleDelete} loading={isDeleting}>確認刪除</Button>
          </div>
        </div>
      </div>
    </>
  )
}
