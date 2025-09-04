// 'use client';

// import { motion, AnimatePresence } from 'framer-motion';
// import { X, RotateCcw, Calendar, User, Hash, FileText } from 'lucide-react';

// const actionButtonStyle = "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed";

// export default function ViewDemeritsModal({ isOpen, onClose, user, onRemoveDemerit, isSubmitting }) {
//     if (!isOpen || !user) return null;

//     const sortedRecords = user.demeritRecords?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

//     return (
//         <AnimatePresence>
//             {isOpen && (
//                 <motion.div
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     exit={{ opacity: 0 }}
//                     className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
//                     onClick={onClose}
//                 >
//                     <motion.div
//                         initial={{ scale: 0.95, y: -20, opacity: 0 }}
//                         animate={{ scale: 1, y: 0, opacity: 1 }}
//                         exit={{ scale: 0.95, y: 20, opacity: 0 }}
//                         transition={{ duration: 0.3, ease: 'easeInOut' }}
//                         className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border border-white/20"
//                         onClick={e => e.stopPropagation()}
//                     >
//                         <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0">
//                             <h2 className="text-lg font-bold text-gray-800">查看 {user.name} 的違規記錄</h2>
//                             <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors"><X size={20} /></button>
//                         </div>

//                         <div className="flex-1 p-6 space-y-4 overflow-y-auto">
//                             {sortedRecords && sortedRecords.length > 0 ? (
//                                 sortedRecords.map(record => (
//                                     <div key={record.record_id} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg border border-gray-200">
//                                         <div className="space-y-1.5">
//                                             <p className="font-semibold text-gray-800 flex items-center gap-2"><FileText size={14} />{record.reason}</p>
//                                             <div className="flex items-center gap-4 text-xs text-gray-500">
//                                                 <span className="flex items-center gap-1"><Hash size={12} />{record.points} 點</span>
//                                                 <span className="flex items-center gap-1"><User size={12} />{record.recorder?.username || '系統管理員'}</span>
//                                                 <span className="flex items-center gap-1"><Calendar size={12} />{new Date(record.created_at).toLocaleDateString('zh-TW')}</span>
//                                             </div>
//                                         </div>
//                                         <button
//                                             onClick={() => onRemoveDemerit(record.record_id)}
//                                             disabled={isSubmitting}
//                                             className={`${actionButtonStyle} border-red-300 bg-transparent text-red-600 hover:bg-red-50`}
//                                         >
//                                             <RotateCcw size={14} />
//                                             <span>撤銷</span>
//                                         </button>
//                                     </div>
//                                 ))
//                             ) : (
//                                 <div className="text-center py-10 text-gray-500">
//                                     <p>太棒了！該使用者目前沒有有效的違規記錄。</p>
//                                 </div>
//                             )}
//                         </div>

//                         <div className="p-4 bg-black/5 flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
//                             <button
//                                 onClick={onClose}
//                                 className={`${actionButtonStyle} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
//                             >
//                                 關閉
//                             </button>
//                         </div>
//                     </motion.div>
//                 </motion.div>
//             )}
//         </AnimatePresence>
//     );
// }