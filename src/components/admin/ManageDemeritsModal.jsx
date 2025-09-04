'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ban, Loader2, FileText, Hash, RotateCcw, Calendar, User as UserIcon, PlusCircle, CheckCircle } from 'lucide-react';

const actionButtonStyle = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 ease-in-out transform whitespace-nowrap hover:-translate-y-0.5 hover:scale-105 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed";
const removeButtonStyle = "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-red-300 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50";

export default function ManageDemeritsModal({ isOpen, onClose, user, onAddDemerit, onRemoveDemerit, isSubmitting }) {
    const [newData, setNewData] = useState({ reason: '', points: 1 });

    const sortedRecords = useMemo(() => {
        if (!user?.demeritRecords) return [];
        // 按照建立時間從新到舊排序
        return [...user.demeritRecords].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [user]);
    
    useEffect(() => {
        if (isOpen) {
            setNewData({ reason: '', points: 1 });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddConfirm = () => {
        onAddDemerit(newData);
        setNewData({ reason: '', points: 1 });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true, // 使用上午/下午
        });
    };
    
    if (!isOpen || !user) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        // --- START: 核心修正區塊 1 ---
                        // 設定最大高度
                        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border"
                        // --- END: 核心修正區塊 1 ---
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center flex-shrink-0 bg-white rounded-t-2xl">
                            {/* --- START: 核心修正區塊 2 --- */}
                            {/* 修改標題格式 */}
                            <h2 className="text-lg font-bold text-gray-800">
                                管理 {user.name} ({user.studentId}) 的違規記錄
                            </h2>
                            {/* --- END: 核心修正區塊 2 --- */}
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-2 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                            {/* --- 現有紀錄列表 --- */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">現有違規記錄 (有效 {user.demerit} 點)</h3>
                                <div className="space-y-3">
                                    {sortedRecords.length > 0 ? (
                                        sortedRecords.map(record => (
                                            <div key={record.record_id} className={`p-4 rounded-lg border ${record.removed_at ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                                                <div className="flex justify-between items-start">
                                                    <p className={`font-medium text-lg text-gray-800 ${record.removed_at ? 'line-through text-gray-500' : ''}`}>
                                                        {record.reason}
                                                    </p>
                                                    {!record.removed_at && (
                                                        <button onClick={() => onRemoveDemerit(record.record_id)} disabled={isSubmitting} className={removeButtonStyle}>
                                                            <RotateCcw size={14} /><span>撤銷</span>
                                                        </button>
                                                    )}
                                                </div>
                                                {/* --- START: 核心修正區塊 3 --- */}
                                                {/* 修改紀錄詳情格式 */}
                                                <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2 ${record.removed_at ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <span className="flex items-center gap-1.5"><Hash size={12}/>{record.points} 點</span>
                                                    <span className="flex items-center gap-1.5"><UserIcon size={12}/>記錄者: {record.recorder?.username || '系統'}</span>
                                                    <span className="flex items-center gap-1.5"><Calendar size={12}/>記錄時間: {formatDateTime(record.created_at)}</span>
                                                </div>
                                                {record.removed_at && (
                                                    <div className="mt-2 text-xs text-red-600 border-t border-red-200/50 pt-2 flex items-center gap-1.5">
                                                        <CheckCircle size={12}/>
                                                        由 {record.remover?.username || '管理員'} 於 {formatDateTime(record.removed_at)} 撤銷
                                                    </div>
                                                )}
                                                {/* --- END: 核心修正區塊 3 --- */}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-dashed">
                                            <p>該使用者沒有任何違規記錄。</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* --- START: 核心修正區塊 4 --- */}
                        {/* 將新增區塊移至底部，並移除分隔線 */}
                        <div className="p-6 bg-gray-100/70 flex-shrink-0 border-t border-gray-200 rounded-b-2xl">
                            <div className="bg-white border border-gray-200 p-4 rounded-lg">
                                <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2"><PlusCircle size={18}/>新增一筆違規</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                    <div className="sm:col-span-1">
                                        <label htmlFor="points" className="text-sm font-medium text-gray-600">記點數</label>
                                        <div className="relative mt-1">
                                            <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input id="points" name="points" type="number" value={newData.points} onChange={handleChange} min="1"
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                disabled={isSubmitting} />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label htmlFor="reason" className="text-sm font-medium text-gray-600">事由 (必填)</label>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="relative flex-grow">
                                                <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input id="reason" name="reason" type="text" value={newData.reason} onChange={handleChange}
                                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    placeholder="請輸入違規事由" disabled={isSubmitting} />
                                            </div>
                                            <button onClick={handleAddConfirm} disabled={isSubmitting || !newData.reason.trim() || !newData.points || newData.points < 1}
                                                className={`${actionButtonStyle} border-gray-300 bg-gray-700 text-white hover:bg-gray-800`}>
                                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                                                <span>新增此筆記錄</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* --- END: 核心修正區塊 4 --- */}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}