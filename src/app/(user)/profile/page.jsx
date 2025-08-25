"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; 
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import { Eye, EyeOff, User as UserIcon, Lock, ShieldCheck, Edit3, Save, LogOut, Loader2, AtSign, Fingerprint, Calendar, Clock, FileText, Home, BedDouble } from "lucide-react";
import Toast from '@/components/ui/Toast';

// --- zxcvbn 設定 ---
zxcvbnOptions.setOptions({
	dictionary: { userInputs: ['ncue', 'scholarship', 'changhua', 'student'] }
});

// --- 子元件: 密碼輸入框 (無變更) ---
const PasswordField = ({ id, name, placeholder, value, onChange, error, isConfirmField = false }) => {
	const [showPassword, setShowPassword] = useState(false);
	const strength = useMemo(() => (!isConfirmField && value) ? zxcvbn(value) : null, [value, isConfirmField]);
	const strengthLevels = [
		{ text: '非常弱', lightColor: 'bg-red-200', color: 'bg-red-500', textColor: 'text-red-700' },
		{ text: '弱', lightColor: 'bg-orange-200', color: 'bg-orange-500', textColor: 'text-orange-700' },
		{ text: '中等', lightColor: 'bg-yellow-200', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
		{ text: '強', lightColor: 'bg-green-200', color: 'bg-green-500', textColor: 'text-green-700' },
		{ text: '非常強', lightColor: 'bg-emerald-200', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
	];
	const currentStrength = strength ? strengthLevels[strength.score] : null;
	return (
		<div className="w-full space-y-2">
			<div className="relative">
				<Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
				<input id={id} name={name} type={showPassword ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={onChange} required className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ${error ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all`} />
				<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600">
					{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
				</button>
			</div>
			{!isConfirmField && currentStrength && (
				<div className="flex items-center gap-2 px-1">
					<div className={`h-1.5 flex-grow rounded-full ${currentStrength.lightColor}`}>
						<div className={`h-full rounded-full ${currentStrength.color} transition-all duration-300`} style={{ width: `${(strength.score + 1) * 20}%` }} />
					</div>
					<p className={`text-xs font-medium ${currentStrength.textColor}`}>{currentStrength.text}</p>
				</div>
			)}
			{error && <p className="mt-1 text-xs text-red-600 px-1">{error}</p>}
		</div>
	);
};

// --- Helper function to render input fields (無變更) ---
const InputField = ({ id, name, placeholder, value, onChange, error, icon: Icon }) => (
    <div>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Icon size={16} className="text-gray-400" />
            </div>
            <input
                type="text" id={id} name={name} value={value} onChange={onChange} placeholder={placeholder}
                className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-4 text-gray-900 ring-1 ring-inset ${error ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 px-1">{error}</p>}
    </div>
);

// --- 主要頁面元件 ---
export default function ProfilePage() {
	const router = useRouter();
	const { user, isAuthenticated, loading, signOut, updateProfile, updatePassword, supabase } = useAuth();

	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({ 
		username: "", 
		student_id: "",
		roomNumber: "",
		bedNumber: ""
	});
	const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
	const [errors, setErrors] = useState({});
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
	const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

	const showToast = (message, type = 'success') => setToast({ show: true, message, type });

	const initializeFormData = () => {
		if (user?.profile) {
			const [roomNum = '', bedNum = ''] = (user.profile.room || '').split('-');
			setFormData({
				username: user.profile.username || "",
				student_id: user.profile.student_id || "",
				roomNumber: roomNum,
				bedNumber: bedNum,
			});
		}
	};

	useEffect(() => {
		if (!loading && !isAuthenticated) {
			router.push('/login');
		}
	}, [isAuthenticated, loading, router]);

	useEffect(() => {
		initializeFormData();
	}, [user]);
	
	const handleCancelEdit = () => {
		setIsEditing(false);
		setErrors({});
		initializeFormData(); 
	};

	const handleProfileChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
	};

	const handlePasswordChange = (e) => {
		setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
		if (errors[e.target.name] || errors.passwordSubmit) setErrors({});
	};

	const validateProfileForm = () => {
		const newErrors = {};
		if (!formData.username.trim()) newErrors.username = "姓名不能為空";
		if (!/^[A-Za-z]\d{7}$/.test(formData.student_id)) newErrors.student_id = "學號格式應為 1 位英文字母加 7 位數字";
		if (!/^\d{3}$/.test(formData.roomNumber)) newErrors.roomNumber = "房號應為 3 位數字";
		if (!/^[1-4]$/.test(formData.bedNumber)) newErrors.bedNumber = "床號應為 1-4";
		return newErrors;
	};

	const handleProfileSubmit = async (e) => {
		e.preventDefault();
		const formErrors = validateProfileForm();
		if (Object.keys(formErrors).length > 0) {
			setErrors(formErrors);
			return;
		}
		if (!supabase) {
			showToast('驗證服務未就緒，請刷新頁面', 'error');
			return;
		}
		setIsSavingProfile(true);
		setErrors({});
		try {
            const formattedData = {
                ...formData,
                student_id: formData.student_id.charAt(0).toUpperCase() + formData.student_id.slice(1),
            };
			const combinedRoom = `${formattedData.roomNumber}-${formattedData.bedNumber}`;
			const studentIdChanged = formattedData.student_id !== user.profile.student_id;
			const roomChanged = combinedRoom !== user.profile.room;
			if (studentIdChanged) {
				const { data, error } = await supabase.from('profiles').select('id').eq('student_id', formattedData.student_id).limit(1).single();
				if (error && error.code !== 'PGRST116') throw error;
				if (data) {
					setErrors({ student_id: '此學號已被其他使用者註冊' });
					showToast('此學號已被其他使用者註冊', 'error');
					setIsSavingProfile(false);
					return;
				}
			}
			if (roomChanged) {
				const { data, error } = await supabase.from('profiles').select('id').eq('room', combinedRoom).limit(1).single();
				if (error && error.code !== 'PGRST116') throw error;
				if (data) {
					setErrors({ roomNumber: '此床位已被使用', bedNumber: '此床位已被使用' });
					showToast('此房號床位已被佔用，請選擇其他床位', 'error');
					setIsSavingProfile(false);
					return;
				}
			}
			const result = await updateProfile({
				username: formattedData.username,
				student_id: formattedData.student_id,
				roomNumber: formattedData.roomNumber,
				bedNumber: formattedData.bedNumber
			});
			if (result.success) {
				showToast('個人資料已成功更新', 'success');
				setIsEditing(false);
			} else {
				showToast(result.error || '更新失敗，請稍後再試', 'error');
			}
		} catch (error) {
			console.error("Profile update failed:", error);
			showToast(`資料庫操作失敗: ${error.message}`, 'error');
		} finally {
			setIsSavingProfile(false);
		}
	};

    // --- START: 核心修正區塊 ---
	// 將 handlePasswordSubmit 的邏輯用 try...finally 包裹
	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		const newErrors = {};
		if (zxcvbn(passwordData.password).score < 2) newErrors.password = '密碼強度不足';
		if (passwordData.password !== passwordData.confirmPassword) newErrors.confirmPassword = '密碼不一致';
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsUpdatingPassword(true);
		setErrors({});

		try {
			const result = await updatePassword(passwordData.password);
			if (result.success) {
				showToast('密碼已成功更新', 'success');
				setPasswordData({ password: '', confirmPassword: '' });
			} else {
				const errorMsg = result.error || '更新失敗';
				setErrors({ passwordSubmit: errorMsg });
				showToast(errorMsg, 'error');
			}
		} catch (error) {
			// 如果 updatePassword 函式本身拋出錯誤，這裡會捕捉到
			console.error("Password update crashed:", error);
			const errorMsg = error.message || '發生了未預期的錯誤';
			setErrors({ passwordSubmit: errorMsg });
			showToast(errorMsg, 'error');
		} finally {
			// 無論成功或失敗，最後都一定會執行這一步
			setIsUpdatingPassword(false);
		}
	};
    // --- END: 核心修正區塊 ---

	if (loading || !isAuthenticated || !user?.profile) {
		return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 text-indigo-600 animate-spin" /></div>;
	}

	const ghostButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:transform-none disabled:shadow-none";
	const primaryGhostButton = `${ghostButtonClasses} border-indigo-600 bg-transparent text-indigo-600 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200`;

	return (
		<>
			<Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24">
				<div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
					<aside className="lg:col-span-1 flex flex-col">
						<div className="w-full flex flex-col flex-grow bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
							<div className="p-6">
								<div className="flex items-center gap-4">
									<div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
										<UserIcon className="h-8 w-8 text-indigo-600" />
									</div>
									<div>
										<h2 className="text-xl font-bold text-gray-900 truncate">{user.profile.username || '使用者'}</h2>
										<p className="text-sm text-gray-500 truncate">{user.email}</p>
									</div>
								</div>
							</div>
							<div className="p-6 border-t border-gray-100">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3"><Fingerprint className="h-5 w-5 text-indigo-600" />帳號狀態</h3>
								<dl className="space-y-4">
									<div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><AtSign size={16} />用戶ID</dt><dd className="text-sm text-gray-900 break-all mt-1">{user.id}</dd></div>
									<div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Calendar size={16} />註冊時間</dt><dd className="text-sm text-gray-900 mt-1">{new Date(user.created_at).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
									{user.last_sign_in_at && <div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Clock size={16} />最後登入時間</dt><dd className="text-sm text-gray-900 mt-1">{new Date(user.last_sign_in_at).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>}
								</dl>
							</div>
							<div className="mt-auto p-6 border-t border-gray-100">
								<button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"><LogOut className="h-5 w-5" /><span>登出</span></button>
							</div>
						</div>
					</aside>
					<main className="lg:col-span-2 flex flex-col gap-8 mt-8 lg:mt-0">
						<div className="bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
							<form onSubmit={handleProfileSubmit}>
								<div className="p-8">
									<h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-6 w-6 text-indigo-600" />個人資料</h2>
									<p className="mt-1 text-sm text-gray-500">請確保您提供的是正確的個人資料。</p>
								</div>
								<div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
									{isEditing ? (
										<>
											<InputField id="username" name="username" placeholder="請輸入您的姓名" value={formData.username} onChange={handleProfileChange} error={errors.username} icon={UserIcon} />
											<InputField id="student_id" name="student_id" placeholder="請輸入您的學號" value={formData.student_id} onChange={handleProfileChange} error={errors.student_id} icon={Fingerprint} />
											<InputField id="roomNumber" name="roomNumber" placeholder="3 位數字" value={formData.roomNumber} onChange={handleProfileChange} error={errors.roomNumber} icon={Home} />
											<InputField id="bedNumber" name="bedNumber" placeholder="1-4" value={formData.bedNumber} onChange={handleProfileChange} error={errors.bedNumber} icon={BedDouble} />
										</>
									) : (
										<>
											<div className="flex flex-col"><dt className="text-sm font-medium text-gray-500">姓名</dt><dd className="text-base text-gray-900 mt-1">{user.profile.username || '未設定'}</dd></div>
											<div className="flex flex-col"><dt className="text-sm font-medium text-gray-500">學號</dt><dd className="text-base text-gray-900 mt-1">{user.profile.student_id || '未設定'}</dd></div>
											<div className="flex flex-col md:col-span-2"><dt className="text-sm font-medium text-gray-500">房號床位</dt><dd className="text-base text-gray-900 mt-1">{user.profile.room || '未設定'}</dd></div>
										</>
									)}
								</div>
								<div className="bg-gray-50 px-8 py-4 rounded-b-xl flex justify-end">
									{isEditing ? (
										<div className="flex gap-2">
											<button type="button" onClick={handleCancelEdit} className={`${ghostButtonClasses} border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100`}>取消</button>
											<button type="submit" disabled={isSavingProfile} className={primaryGhostButton}>
												{isSavingProfile ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}儲存
											</button>
										</div>
									) : (
										<button type="button" onClick={() => setIsEditing(true)} className={primaryGhostButton}><Edit3 className="h-4 w-4" />編輯</button>
									)}
								</div>
							</form>
						</div>
						<div className="bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
							<form onSubmit={handlePasswordSubmit}>
								<div className="p-8">
									<h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><Lock className="h-6 w-6 text-indigo-600" />帳號安全</h2>
									<p className="mt-1 text-sm text-gray-500">建議您定期更換密碼以維持帳號安全。</p>
									<div className="mt-6 border-t border-gray-100 pt-6 space-y-6">
										<PasswordField id="password" name="password" placeholder="設定新密碼" value={passwordData.password} onChange={handlePasswordChange} error={errors.password} />
										<PasswordField id="confirmPassword" name="confirmPassword" placeholder="再次輸入新密碼" value={passwordData.confirmPassword} onChange={handlePasswordChange} error={errors.confirmPassword} isConfirmField={true} />
										{errors.passwordSubmit && <p className="text-sm text-red-600">{errors.passwordSubmit}</p>}
									</div>
								</div>
								<div className="bg-gray-50 px-8 py-4 rounded-b-xl flex justify-end">
									<button type="submit" disabled={isUpdatingPassword} className={primaryGhostButton}>
										{isUpdatingPassword ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}更新密碼
									</button>
								</div>
							</form>
						</div>
					</main>
				</div>
			</main>
		</>
	);
}