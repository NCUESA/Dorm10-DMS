// 'use client';

// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { X, Ban, Loader2, FileText, Hash } from 'lucide-react';

// const actionButtonStyle = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 ease-in-out transform whitespace-nowrap hover:-translate-y-0.5 hover:scale-105 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed";

// export default function AddDemeritModal({ isOpen, onClose, user, onConfirm, isSubmitting }) {
//     const [demeritData, setDemeritData] = useState({ reason: '', points: 1 });

//     useEffect(() => {
//         if (isOpen) {
//             setDemeritData({ reason: '', points: 1 });
//         }
//     }, [isOpen]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setDemeritData(prev => ({ ...prev, [name]: value }));
//     };

//     const handleConfirm = () => {
//         onConfirm(demeritData);
//     };

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
//                         initial={{ scale: 0.95, opacity: 0 }}
//                         animate={{ scale: 1, opacity: 1 }}
//                         exit={{ scale: 0.95, opacity: 0 }}
//                         className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
//                         onClick={e => e.stopPropagation()}
//                     >
//                         <div className="p-5 border-b border-black/10 flex justify-between items-center">
//                             <h2 className="text-lg font-bold text-gray-800">為 {user?.name} 新增違規紀錄</h2>
//                             <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full"><X size={20} /></button>
//                         </div>
                        
//                         <div className="p-6 space-y-6">
//                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                                 <div className="sm:col-span-1">
//                                     <label htmlFor="points" className="block text-sm font-semibold text-gray-700 mb-1.5">記點數</label>
//                                     <div className="relative">
//                                         <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                                         <input id="points" name="points" type="number" value={demeritData.points} onChange={handleChange} min="1"
//                                             className="w-full pl-9 pr-3 py-2 bg-white/70 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
//                                             disabled={isSubmitting} />
//                                     </div>
//                                 </div>
//                                 <div className="sm:col-span-2">
//                                     <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-1.5">事由</label>
//                                     <div className="relative">
//                                         <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                                         <input id="reason" name="reason" type="text" value={demeritData.reason} onChange={handleChange}
//                                             className="w-full pl-9 pr-3 py-2 bg-white/70 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
//                                             placeholder="請輸入違規事由 (必填)" disabled={isSubmitting} />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="p-4 bg-black/5 flex justify-end gap-3 rounded-b-2xl">
//                             <button
//                                 onClick={handleConfirm}
//                                 disabled={isSubmitting || !demeritData.reason.trim() || !demeritData.points || demeritData.points < 1}
//                                 className={`${actionButtonStyle} border-red-400 bg-transparent text-red-600 hover:bg-red-100 hover:text-red-700`}
//                             >
//                                 {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
//                                 <span>{isSubmitting ? '記錄中...' : '確認並記錄違規'}</span>
//                             </button>
//                         </div>
//                     </motion.div>
//                 </motion.div>
//             )}
//         </AnimatePresence>
//     );
// }