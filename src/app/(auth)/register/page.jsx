"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Register() {
  const router = useRouter();
  const { signUp, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    department: "",
    year: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 檢查是否已經登入
    if (!loading && isAuthenticated) {
      router.push('/profile'); // 已登入則重定向到個人資料頁面
    }
  }, [isAuthenticated, loading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除對應的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    // 清除訊息
    if (message) {
      setMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "請輸入姓名";
    }
    
    if (!formData.email) {
      newErrors.email = "請輸入電子郵件";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件格式";
    }
    
    if (!formData.studentId.trim()) {
      newErrors.studentId = "請輸入學號";
    }
    
    if (!formData.password) {
      newErrors.password = "請輸入密碼";
    } else if (formData.password.length < 8) {
      newErrors.password = "密碼至少需要8個字符";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "請確認密碼";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "密碼確認不一致";
    }
    
    if (!formData.department) {
      newErrors.department = "請選擇系所";
    }
    
    if (!formData.year) {
      newErrors.year = "請選擇年級";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    setMessage("");
    
    try {
      // 準備用戶資料
      const userData = {
        name: formData.name,
        student_id: formData.studentId,
        department: formData.department,
        year: formData.year
      };

      const result = await signUp(formData.email, formData.password, userData);
      
      if (result.success) {
        setIsSuccess(true);
        setMessage("註冊成功！我們已發送確認郵件到您的信箱，請點擊郵件中的連結來啟用您的帳號。");
      } else {
        setErrors({ submit: result.error });
      }
      
    } catch (error) {
      setErrors({ submit: "註冊失敗，請檢查您的網路連線" });
    } finally {
      setIsLoading(false);
    }
  };

  const departments = [
    "資訊工程學系", "電機工程學系", "機械工程學系", "化學工程學系",
    "材料科學與工程學系", "土木工程學系", "企業管理學系", "會計學系",
    "財務金融學系", "國際企業學系", "應用數學系", "物理學系",
    "化學系", "生物學系", "中國文學系", "英語學系",
    "歷史學系", "地理學系", "教育學系", "心理與諮商學系"
  ];

  const years = ["大一", "大二", "大三", "大四", "碩一", "碩二", "博一", "博二", "博三", "博四"];

  // 如果註冊成功，顯示成功頁面
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              註冊成功！
            </h2>
            
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              我們已經發送驗證郵件到 <strong>{formData.email}</strong>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2" style={{ color: 'var(--primary)' }}>
                接下來該怎麼做？
              </h3>
              <ol className="text-sm text-left space-y-2" style={{ color: 'var(--text-muted)' }}>
                <li>1. 檢查您的電子郵件收件箱</li>
                <li>2. 找到來自 NCUE 獎助學金平台的郵件</li>
                <li>3. 點擊郵件中的驗證連結</li>
                <li>4. 完成驗證後即可開始使用</li>
              </ol>
            </div>
            
            <div className="space-y-4">
              <Link href="/login" className="btn-primary w-full">
                前往登入頁面
              </Link>
              
              <Link href="/verify-email" className="btn-secondary w-full">
                郵件驗證頁面
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm nav-link underline-extend"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-2xl w-full">
        {/* Logo 和標題 */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--primary)' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
            註冊新帳號
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            加入 NCUE 獎助學金資訊平台，開始您的獎學金申請之旅
          </p>
        </div>

        {/* 註冊表單 */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#fee', color: 'var(--error)', border: '1px solid var(--error)' }}>
                {errors.submit}
              </div>
            )}

            {message && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#e8f5e8', color: '#2d5f2d', border: '1px solid #4caf50' }}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  姓名 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="input-field"
                  placeholder="請輸入您的姓名"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="form-error">{errors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="studentId" className="form-label">
                  學號 *
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  required
                  className="input-field"
                  placeholder="請輸入您的學號"
                  value={formData.studentId}
                  onChange={handleChange}
                />
                {errors.studentId && (
                  <p className="form-error">{errors.studentId}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                電子郵件 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field"
                placeholder="請輸入您的電子郵件"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="form-group">
                <label htmlFor="department" className="form-label">
                  系所 *
                </label>
                <select
                  id="department"
                  name="department"
                  required
                  className="input-field"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">請選擇系所</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="form-error">{errors.department}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="year" className="form-label">
                  年級 *
                </label>
                <select
                  id="year"
                  name="year"
                  required
                  className="input-field"
                  value={formData.year}
                  onChange={handleChange}
                >
                  <option value="">請選擇年級</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.year && (
                  <p className="form-error">{errors.year}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  密碼 *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field"
                  placeholder="請輸入密碼（至少8個字符）"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="form-error">{errors.password}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  確認密碼 *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field"
                  placeholder="請再次輸入密碼"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 rounded border-gray-300"
                style={{ accentColor: 'var(--primary)' }}
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm" style={{ color: 'var(--text)' }}>
                我同意 <Link href="/terms" className="underline-extend" style={{ color: 'var(--primary)' }}>使用條款</Link> 及 <Link href="/privacy" className="underline-extend" style={{ color: 'var(--primary)' }}>隱私政策</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "註冊中..." : "註冊帳號"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white" style={{ color: 'var(--text-muted)' }}>
                  或
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                已經有帳號了？{' '}
                <Link
                  href="/login"
                  className="font-medium underline-extend"
                  style={{ color: 'var(--primary)' }}
                >
                  立即登入
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}