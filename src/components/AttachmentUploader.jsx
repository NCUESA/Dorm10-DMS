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

  const handleRemove = (idx) => {
    setFiles(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
      >
        選擇檔案
      </button>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <ul className="mt-2 space-y-1">
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
    </div>
  )
}
