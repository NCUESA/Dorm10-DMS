'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [show, setShow] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', role: '' })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || '一般使用者'
      })
      setTimeout(() => setShow(true), 50)
    } else {
      setShow(false)
    }
  }, [isOpen, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    if (onSave) onSave({ ...user, ...formData })
    handleClose()
  }

  const handleClose = useCallback(() => {
    setShow(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-50 pt-20 pb-10 px-4 flex justify-center items-start overflow-y-auto transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-modal="true"
        role="dialog"
      >
        <div
          className={`bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col transition-all duration-300 ${show ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800">編輯使用者</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full"
            >
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">姓名</label>
              <input
                type="text"
                name="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">電子信箱</label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">權限</label>
              <select
                name="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="管理員">管理員</option>
                <option value="一般使用者">一般使用者</option>
              </select>
            </div>
          </div>
          <div className="p-4 bg-gray-100/80 backdrop-blur-sm border-t flex justify-end space-x-3 flex-shrink-0 rounded-b-2xl">
            <Button type="button" variant="secondary" onClick={handleClose}>取消</Button>
            <Button type="button" variant="primary" onClick={handleSave}>保存</Button>
          </div>
        </div>
      </div>
    </>
  )
}
