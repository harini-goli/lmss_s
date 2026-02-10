import { getEmbedUrl } from '../../../utils/urlHelper';
import TextStreamPlayer from '../../student/CoursePlayer/TextStreamPlayer';
import { CheckCircle2, XCircle, Play, FileText, AlertCircle, BookOpen, Clock, ShieldCheck, Eye, Video } from 'lucide-react';

const ApproveCoursesView = ({
    loading, pendingCourses, selectedCourse, setSelectedCourse, handleAction, modules,
    previewModuleId, setPreviewModuleId, previewUrl, setPreviewUrl,
    previewModuleType, setPreviewModuleType
}) => {

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[var(--color-indigo-600)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium tracking-tight">Loading courses queue...</p>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col p-2 bg-slate-50 font-sans w-full">
            { }
            <div className="flex justify-between items-center mb-6 shrink-0 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-indigo-600)] flex items-center justify-center border border-indigo-100 shadow-sm">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Course Approval Queue</h2>
                        <p className="text-base text-slate-500 font-medium">Review pending content before publication.</p>
                    </div>
                </div>
                <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wide border border-amber-100 shadow-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {pendingCourses.length} Pending Approval
                </div>
            </div>

            { }
            <div className={`flex flex-1 gap-6 overflow-hidden w-full ${selectedCourse ? 'grid grid-cols-1 lg:grid-cols-[1fr_500px]' : ''}`}>

                { }
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300">
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-sm font-bold text-slate-700 uppercase tracking-wide">
                                <tr>
                                    <th className="py-4 px-6">Course Title</th>
                                    <th className="py-4 px-6 md:table-cell hidden">Instructor</th>
                                    <th className="py-4 px-6">Category</th>
                                    <th className="py-4 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                    <CheckCircle2 size={32} />
                                                </div>
                                                <p className="font-medium text-base">No courses pending approval.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pendingCourses.map(course => (
                                        <tr
                                            key={course.courses_id}
                                            onClick={() => setSelectedCourse(course)}
                                            className={`cursor-pointer transition-all hover:bg-slate-50 group border-l-4 ${selectedCourse?.courses_id === course.courses_id
                                                ? 'bg-indigo-50/50 border-[var(--color-indigo-600)]'
                                                : 'border-transparent hover:border-slate-300'
                                                }`}
                                        >
                                            <td className="py-4 px-6">
                                                <div className={`font-bold text-base transition-colors ${selectedCourse?.courses_id === course.courses_id ? 'text-[var(--color-indigo-600)]' : 'text-slate-800'}`}>
                                                    {course.title}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 text-sm font-medium md:table-cell hidden">
                                                {course.instructor_name || course.instructor_id}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                                    {course.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button className={`text-xs font-bold border px-3 py-1.5 rounded-lg shadow-sm transition-all ${selectedCourse?.courses_id === course.courses_id
                                                    ? 'bg-white border-[var(--color-indigo-600)] text-[var(--color-indigo-600)]'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}>
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                { }
                {selectedCourse && (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden animate-slide-in-right h-full">
                        { }
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 tracking-tight">{selectedCourse.title}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                                    <span className="text-[var(--color-indigo-600)]">{selectedCourse.category}</span> • {selectedCourse.instructor_name || 'Unknown'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        { }
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Description</h4>
                                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 text-base font-medium">
                                    {selectedCourse.description}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    Content ({modules.length} Modules)
                                </h4>
                                <div className="space-y-2">
                                    {modules.map((m, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${m.type === 'video' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-[var(--color-indigo-600)]'
                                                }`}>
                                                {m.type === 'video' ? <Play size={16} fill="currentColor" /> : <FileText size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-slate-800 text-sm truncate">{m.title}</div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                    {m.type} • <Clock size={10} /> {m.duration_mins} mins
                                                </div>
                                            </div>
                                            {m.type === 'text_stream' || m.type === 'video' ? (
                                                <button
                                                    onClick={() => {
                                                        setPreviewModuleId(m.module_id);
                                                        setPreviewUrl(m.content_url);
                                                        setPreviewModuleType(m.type);
                                                    }}
                                                    className="text-xs font-bold text-[var(--color-indigo-600)] hover:underline px-3 bg-indigo-50 py-1.5 rounded-md flex items-center gap-1"
                                                >
                                                    <Eye size={12} /> View
                                                </button>
                                            ) : m.content_url && (
                                                <a
                                                    href={m.content_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-[var(--color-indigo-600)] hover:underline px-3 bg-indigo-50 py-1.5 rounded-md"
                                                >
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        { }
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-xl font-bold border border-red-100 hover:bg-red-50 transition-colors text-sm shadow-sm"
                                onClick={() => handleAction(selectedCourse.courses_id, 'rejected')}
                            >
                                <XCircle size={18} /> Reject
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all text-sm"
                                onClick={() => handleAction(selectedCourse.courses_id, 'approved')}
                            >
                                <CheckCircle2 size={18} /> Approve
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Text Stream Preview Modal --- */}
            {previewModuleId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative border border-slate-700">
                        <div className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Content Preview</span>
                            <button
                                onClick={() => {
                                    setPreviewModuleId(null);
                                    setPreviewUrl(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden bg-slate-900">
                            {previewModuleType === 'text_stream' ? (
                                <TextStreamPlayer moduleId={previewModuleId} url={previewUrl} />
                            ) : (
                                <div className="w-full h-full relative">
                                    <iframe
                                        className="w-full h-full"
                                        src={getEmbedUrl(previewUrl)}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                        allowFullScreen
                                        title="Content Player"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApproveCoursesView;
