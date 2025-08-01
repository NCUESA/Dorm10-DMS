'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import StudentInfoForm from '@/components/StudentInfoForm'
import PreferenceForm from '@/components/PreferenceForm'
import ChatInterface from '@/components/ChatInterface'

export default function ChatPage() {
  const { user } = useAuth()
  const [info, setInfo] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [phase, setPhase] = useState('info') // info -> preference -> chat

  const handleInfoSubmit = (data) => {
    setInfo(data)
    setPhase('preference')
  }

  const handlePrefSubmit = (data) => {
    setPreferences(data)
    setPhase('chat')
  }

  const userInfo = useMemo(() => ({
    department: user?.user_metadata?.department || '',
    grade: user?.user_metadata?.year || ''
  }), [user])

  if (phase === 'info') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <StudentInfoForm onSubmit={handleInfoSubmit} initialData={userInfo} />
      </div>
    )
  }

  if (phase === 'preference') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <PreferenceForm onSubmit={handlePrefSubmit} />
      </div>
    )
  }

  return <ChatInterface userInfo={info} preferences={preferences} />
}
