import { useRef } from 'react'

export default function AttachmentUploader({ files = [], setFiles, disabled }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) {
      setFiles([...files, ...selected])
    }
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (disabled) return
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length > 0) {
      setFiles([...files, ...dropped])
    }
  }

  const handleRemove = (idx) => {
    setFiles(files.filter((_, i) => i !== idx))
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-4 text-center ${disabled ? 'bg-gray-100' : 'hover:border-indigo-400 cursor-pointer'}`}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      {files.length === 0 ? (
        <p className="text-sm text-gray-500">拖曳檔案至此或點擊選擇</p>
      ) : (
        <ul className="space-y-1">
          {files.map((f, idx) => (
            <li key={idx} className="flex justify-between items-center bg-gray-100 rounded px-2 py-1 text-sm">
              <span className="break-all">{f.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-red-500 text-xs ml-2"
              >
                移除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
