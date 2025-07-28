'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function FunctionalTestPage() {
  const { user, loading, signUp, signIn, signOut } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [testLog, setTestLog] = useState([])

  // 測試用的帳號資料
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!'
  }

  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    setTestLog(prev => [logEntry, ...prev])
    console.log(logEntry)
  }

  const updateTestResult = (testName, result, error = null) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: { result, error, timestamp: new Date().toISOString() }
    }))
    log(`Test "${testName}": ${result}`, result === 'PASS' ? 'info' : 'error')
    if (error) log(`Error: ${error}`, 'error')
  }

  // 1. 測試 Supabase 連接
  const testSupabaseConnection = async () => {
    try {
      log('Testing Supabase connection...')
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      updateTestResult('Supabase Connection', 'PASS')
      return true
    } catch (error) {
      updateTestResult('Supabase Connection', 'FAIL', error.message)
      return false
    }
  }

  // 2. 測試註冊功能
  const testSignUp = async () => {
    try {
      log('Testing sign up...')
      const { data, error } = await signUp(testUser.email, testUser.password)
      if (error) throw error
      updateTestResult('Sign Up', 'PASS')
      log('Sign up successful, please check email for verification')
      return true
    } catch (error) {
      // 如果用戶已存在，這也算是正常情況
      if (error.message.includes('already registered')) {
        updateTestResult('Sign Up', 'PASS', 'User already exists - this is expected')
        return true
      }
      updateTestResult('Sign Up', 'FAIL', error.message)
      return false
    }
  }

  // 3. 測試登入功能
  const testSignIn = async () => {
    try {
      log('Testing sign in...')
      const { data, error } = await signIn(testUser.email, testUser.password)
      if (error) throw error
      updateTestResult('Sign In', 'PASS')
      return true
    } catch (error) {
      updateTestResult('Sign In', 'FAIL', error.message)
      return false
    }
  }

  // 4. 測試登出功能
  const testSignOut = async () => {
    try {
      log('Testing sign out...')
      const { error } = await signOut()
      if (error) throw error
      updateTestResult('Sign Out', 'PASS')
      return true
    } catch (error) {
      updateTestResult('Sign Out', 'FAIL', error.message)
      return false
    }
  }

  // 5. 測試密碼重設
  const testPasswordReset = async () => {
    try {
      log('Testing password reset...')
      const { error } = await supabase.auth.resetPasswordForEmail(testUser.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      updateTestResult('Password Reset', 'PASS')
      log('Password reset email sent')
      return true
    } catch (error) {
      updateTestResult('Password Reset', 'FAIL', error.message)
      return false
    }
  }

  // 執行所有測試
  const runAllTests = async () => {
    log('Starting comprehensive authentication tests...')
    setTestResults({})
    
    // 按順序執行測試
    const connectionOk = await testSupabaseConnection()
    if (!connectionOk) return

    await testSignUp()
    await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒

    await testSignIn()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testPasswordReset()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testSignOut()
    
    log('All tests completed!')
  }

  const getTestStatus = (testName) => {
    const result = testResults[testName]
    if (!result) return '⏳ Pending'
    return result.result === 'PASS' ? '✅ PASS' : '❌ FAIL'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Authentication Functional Tests
          </h1>

          {/* 用戶狀態 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Current User Status:</h2>
            {loading ? (
              <p>Loading...</p>
            ) : user ? (
              <div>
                <p>✅ Logged in as: {user.email}</p>
                <p>User ID: {user.id}</p>
                <p>Email verified: {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
              </div>
            ) : (
              <p>❌ Not logged in</p>
            )}
          </div>

          {/* 測試控制 */}
          <div className="mb-6">
            <button
              onClick={runAllTests}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🚀 Run All Tests
            </button>
          </div>

          {/* 測試結果 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
              <div className="space-y-2">
                {[
                  'Supabase Connection',
                  'Sign Up',
                  'Sign In',
                  'Password Reset',
                  'Sign Out'
                ].map(test => (
                  <div key={test} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{test}</span>
                    <span className={`text-sm ${
                      testResults[test]?.result === 'PASS' ? 'text-green-600' :
                      testResults[test]?.result === 'FAIL' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {getTestStatus(test)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Test Log:</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {testLog.length === 0 ? (
                  <p className="text-gray-500">No logs yet. Run tests to see output.</p>
                ) : (
                  testLog.map((entry, index) => (
                    <div key={index} className="mb-1">{entry}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 手動測試連結 */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Manual Testing Links:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/login" className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-center hover:bg-blue-200 transition-colors">
                Login Page
              </Link>
              <Link href="/register" className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-center hover:bg-green-200 transition-colors">
                Register Page
              </Link>
              <Link href="/forgot-password" className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-center hover:bg-yellow-200 transition-colors">
                Forgot Password
              </Link>
              <Link href="/reset-password" className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-center hover:bg-red-200 transition-colors">
                Reset Password
              </Link>
              <Link href="/verify-email" className="bg-purple-100 text-purple-800 px-4 py-2 rounded-md text-center hover:bg-purple-200 transition-colors">
                Verify Email
              </Link>
              <Link href="/profile" className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-md text-center hover:bg-indigo-200 transition-colors">
                Profile Page
              </Link>
            </div>
          </div>

          {/* 測試用帳號資訊 */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Test Account Details:</h3>
            <p className="text-yellow-700">Email: {testUser.email}</p>
            <p className="text-yellow-700">Password: {testUser.password}</p>
            <p className="text-sm text-yellow-600 mt-2">
              ⚠️ This is for testing purposes only. In production, use your own credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
