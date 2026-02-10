import React from 'react';
import { Plus, Video, FileText, ArrowRight, ArrowLeft, Save, Trash2, Check, ArrowUp, ArrowDown, Info, Upload, Eye } from 'lucide-react';
import TextStreamPlayer from '../../student/CoursePlayer/TextStreamPlayer';


const AddCourseView = ({
    step, setStep, loading,
    courseData, handleCourseChange,
    moduleForm, handleModuleChange,
    isCustomCategory,
    videoInputType, setVideoInputType,
    pdfInputType, setPdfInputType,
    handleFileUpload, uploading, uploadProgress,
    addModule, removeModule, moveModule,

    handleSubmit, editCourseId,
    // Bulk Upload Props
    showBulkUpload, setShowBulkUpload,
    handleBulkFileSelect, bulkFile,
    handleBulkUpload,
    bulkUploadProgress, isBulkUploading,
    bulkUploadResult, closeBulkUpload,
    // Module Bulk Upload Props
    showModuleBulkUpload, setShowModuleBulkUpload,
    handleModuleBulkFileSelect, moduleBulkFile,
    handleModuleResourceFilesSelect, moduleResourceFiles,
    handleModuleBulkUpload,
    moduleBulkUploadProgress, isModuleBulkUploading,
    moduleBulkUploadResult, closeModuleBulkUpload,
    // Preview Props
    previewModuleId, setPreviewModuleId
}) => {


    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium animate-pulse">
            Processing course data...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-2 font-sans text-primary-900 flex flex-col">
            <div className="w-full max-w-none space-y-4 flex-1 flex flex-col">

                {/* --- Header Section --- */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 border-b border-slate-200 pb-4 shrink-0 bg-white px-6 py-4 rounded-lg shadow-sm border">
                    <div>
                        <h1 className="text-2xl font-bold text-primary-900 tracking-tight">
                            {editCourseId ? 'Edit Course' : 'Create New Course'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Configure course details and curriculum.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${step >= s ? 'bg-primary-900 text-white border-primary-900' : 'bg-white text-slate-400 border-slate-200'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && <div className={`w-8 h-0.5 mx-1 transition-all ${step > s ? 'bg-primary-900' : 'bg-slate-200'}`}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Bulk Upload Button (Only if not editing) --- */}
                {!editCourseId && (
                    <div className="bg-white border-b border-slate-200 px-6 py-2 flex justify-end">
                        <button
                            onClick={() => setShowBulkUpload(true)}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
                        >
                            <Upload size={14} /> Bulk Upload (CSV)
                        </button>
                    </div>
                )}


                {/* --- Main Content --- */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 p-6">

                    {/* STEP 1: Course Details */}
                    {step === 1 && (
                        <div className="w-full">
                            <h3 className="text-lg font-bold text-primary-900 border-b border-slate-100 pb-4 mb-6 uppercase tracking-wide text-sm flex items-center gap-2">
                                <Info className="text-slate-400" size={16} /> Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Course Title <span className="text-rose-500">*</span></label>
                                        <input
                                            name="title"
                                            placeholder="e.g. Advanced System Design"
                                            value={courseData.title}
                                            onChange={handleCourseChange}
                                            autoFocus
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all font-medium text-primary-900 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                                        <textarea
                                            name="description"
                                            rows="5"
                                            placeholder="Overview of learning outcomes..."
                                            value={courseData.description}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all font-medium text-primary-900 text-sm resize-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thumbnail URL</label>
                                        <input
                                            name="thumbnail"
                                            placeholder="https://..."
                                            value={courseData.thumbnail}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all font-medium text-primary-900 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category <span className="text-rose-500">*</span></label>
                                        <select
                                            name="category"
                                            value={isCustomCategory ? 'custom' : courseData.category}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-700 text-sm cursor-pointer"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Web Development">Web Development</option>
                                            <option value="DevOps">DevOps</option>
                                            <option value="Data Science">Data Science</option>
                                            <option value="Business">Business</option>
                                            <option value="Design">Design</option>
                                            <option value="custom">+ Add New</option>
                                        </select>
                                    </div>

                                    {isCustomCategory && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-xs font-bold text-indigo-600 uppercase tracking-wide">New Category Name</label>
                                            <input
                                                name="customCategory"
                                                placeholder="Enter category name"
                                                value={courseData.customCategory}
                                                onChange={handleCourseChange}
                                                className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Level <span className="text-rose-500">*</span></label>
                                            <select
                                                name="level"
                                                value={courseData.level}
                                                onChange={handleCourseChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-slate-700 text-sm"
                                            >
                                                <option value="">Select Level</option>
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Validity <span className="text-rose-500">*</span></label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    name="validity_value"
                                                    value={courseData.validity_value}
                                                    onChange={handleCourseChange}
                                                    className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                />
                                                <select
                                                    name="validity_unit"
                                                    value={courseData.validity_unit}
                                                    onChange={handleCourseChange}
                                                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                >
                                                    <option value="days">Days</option>
                                                    <option value="months">Months</option>
                                                    <option value="years">Years</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* --- NEW: Schedule & Pricing --- */}
                                <div className="space-y-6 pt-4 border-t border-slate-100">

                                    {/* Schedule Release */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Schedule Release (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            name="scheduledDate"
                                            value={courseData.scheduledDate || ''}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-slate-700 text-sm"
                                        />
                                    </div>

                                    {/* Pricing Section */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pricing Strategy</label>

                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-md hover:bg-slate-50 flex-1">
                                                <input
                                                    type="radio"
                                                    name="isPaid"
                                                    value="false"
                                                    checked={courseData.isPaid === false || courseData.isPaid === 'false'}
                                                    onChange={(e) => handleCourseChange({ target: { name: 'isPaid', value: false } })}
                                                    className="text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-semibold text-slate-700">Free Course</span>
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-md hover:bg-slate-50 flex-1">
                                                <input
                                                    type="radio"
                                                    name="isPaid"
                                                    value="true"
                                                    checked={courseData.isPaid === true || courseData.isPaid === 'true'}
                                                    onChange={(e) => handleCourseChange({ target: { name: 'isPaid', value: true } })}
                                                    className="text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-semibold text-slate-700">Paid Course</span>
                                            </label>
                                        </div>

                                        {(courseData.isPaid === true || courseData.isPaid === 'true') && (
                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                                <label className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Price (INR)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        name="price"
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        value={courseData.price || ''}
                                                        onChange={handleCourseChange}
                                                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-emerald-200 rounded-md focus:border-emerald-500 focus:ring-0 outline-none text-slate-900 font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <button
                                    className="bg-primary-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    onClick={() => setStep(2)}
                                    disabled={!courseData.title || (!courseData.category && !courseData.customCategory) || !courseData.level}
                                >
                                    Proceed to Curriculum <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Curriculum */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                            {/* Left: Module Form */}
                            <div className="lg:col-span-1 border-r border-slate-200 pr-8">
                                <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wide mb-6">Add Module Content</h3>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">Title</label>
                                        <input
                                            name="title"
                                            placeholder="Module Name"
                                            value={moduleForm.title}
                                            onChange={handleModuleChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">Type</label>
                                            <select
                                                name="type"
                                                value={moduleForm.type}
                                                onChange={handleModuleChange}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                            >
                                                <option value="video">Video</option>
                                                <option value="pdf">PDF</option>
                                                <option value="text_stream">Text Stream</option>
                                            </select>
                                        </div>
                                        {moduleForm.type === 'video' && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-500">Duration (m)</label>
                                                <input
                                                    type="number"
                                                    name="duration"
                                                    value={moduleForm.duration}
                                                    onChange={handleModuleChange}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-slate-500">Source</label>
                                            <div className="flex gap-2">
                                                <span onClick={() => setVideoInputType('url')} className={`cursor-pointer text-xs ${videoInputType === 'url' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Link</span>
                                                <span className="text-slate-300 text-xs">|</span>
                                                <span onClick={() => setVideoInputType('upload')} className={`cursor-pointer text-xs ${videoInputType === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Upload</span>
                                            </div>
                                        </div>

                                        {videoInputType === 'url' ? (
                                            <input
                                                name="url"
                                                placeholder={moduleForm.type === 'video' ? "https://youtube.com/..." : "https://example.com/file.pdf"}
                                                value={moduleForm.url}
                                                onChange={handleModuleChange}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                            />
                                        ) : (
                                            <div className="border border-dashed border-slate-300 rounded-md p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                                                <input
                                                    type="file"
                                                    accept={moduleForm.type === 'video' ? "video/*" : moduleForm.type === 'text_stream' ? ".txt,.html" : "application/pdf"}
                                                    onChange={(e) => handleFileUpload(e.target.files[0], 'url')}
                                                    disabled={uploading}
                                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                />
                                                <div className="text-xs text-slate-500">
                                                    {uploading ? `Uploading ${Math.round(uploadProgress)}%...` : (moduleForm.url ? 'File Uploaded' : 'Click to Upload Content')}
                                                </div>
                                                {uploading && (
                                                    <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Module Notes Section - Restored as requested */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Module Notes (Optional)</label>
                                        <div className="border border-dashed border-slate-300 rounded-md p-3 text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => handleFileUpload(e.target.files[0], 'notes')}
                                                disabled={uploading}
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                            />
                                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                <FileText className="text-slate-400" size={14} />
                                                {moduleForm.notes ? 'Notes Attached' : 'Upload PDF Notes'}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="w-full bg-primary-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm mt-4"
                                        onClick={addModule}
                                        disabled={!moduleForm.title || !moduleForm.url}
                                    >
                                        <Plus size={12} /> Add Module
                                    </button>
                                </div>

                                <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center">
                                    <button className="text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2" onClick={() => setStep(1)}>
                                        <ArrowLeft size={12} /> Back
                                    </button>
                                    <button className="bg-primary-900 hover:bg-slate-800 text-white font-semibold py-2 px-6 rounded-md text-sm flex items-center gap-2" onClick={() => setStep(3)}>
                                        Review <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Right: Module List */}
                            <div className="lg:col-span-2">
                                <div className="bg-[#f8fafc] h-full rounded-lg border border-slate-200 flex flex-col">
                                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-lg">
                                        <h3 className="text-sm font-bold text-primary-900">Curriculum ({courseData.modules.length})</h3>
                                        <button
                                            onClick={() => setShowModuleBulkUpload(true)}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            <Upload size={12} /> Bulk Upload
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-auto p-4 space-y-2">
                                        {courseData.modules.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                                <p>No modules added yet.</p>
                                            </div>
                                        ) : (
                                            courseData.modules.map((m, idx) => (
                                                <div key={m.id} className="bg-white p-3 rounded-md border border-slate-200 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                        <div>
                                                            <div className="font-semibold text-primary-900 text-sm">{m.title}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                <span className="uppercase font-bold text-[10px]">{m.type}</span>
                                                                {m.duration && <span>• {m.duration} mins</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {m.type === 'text_stream' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (!m.id || m.id.length < 10) { // Simple check for temp ID (usually timestamp)
                                                                        alert("Please save the course as a Draft first to preview new modules.");
                                                                    } else {
                                                                        setPreviewModuleId(m.id);
                                                                    }
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                                title="Preview Stream"
                                                            >
                                                                <Eye size={12} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => moveModule(idx, -1)} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><ArrowUp size={12} /></button>
                                                        <button onClick={() => moveModule(idx, 1)} disabled={idx === courseData.modules.length - 1} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><ArrowDown size={12} /></button>
                                                        <button onClick={() => removeModule(m.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Text Stream Preview Modal --- */}
                    {previewModuleId && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden relative">
                                <button
                                    onClick={() => setPreviewModuleId(null)}
                                    className="absolute top-4 right-4 z-50 bg-slate-800 text-white p-2 rounded-full hover:bg-slate-700 transition-colors shadow-lg"
                                >
                                    &times;
                                </button>
                                <div className="flex-1 overflow-hidden">
                                    <TextStreamPlayer moduleId={previewModuleId} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Review */}
                    {step === 3 && (
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold text-primary-900">Final Verification</h3>
                                <p className="text-slate-500 text-sm">Review course details before publishing.</p>
                            </div>

                            <div className="bg-[#f8fafc] border border-slate-200 rounded-lg overflow-hidden">
                                <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Title</div>
                                        <div className="text-sm font-semibold text-primary-900">{courseData.title}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Category</div>
                                        <div className="text-sm font-semibold text-primary-900">{isCustomCategory ? courseData.customCategory : courseData.category}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Level</div>
                                        <div className="text-sm font-semibold text-primary-900">{courseData.level}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Content</div>
                                        <div className="text-sm font-semibold text-primary-900">{courseData.modules.length} Modules <span className="text-slate-400 font-normal">({courseData.modules.reduce((acc, m) => acc + Number(m.duration || 0), 0)} mins)</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                                    <button className="text-slate-600 font-bold text-sm flex items-center gap-2 hover:text-primary-900" onClick={() => setStep(2)}>
                                        <ArrowLeft size={12} /> Edit Content
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-md text-sm hover:bg-slate-50"
                                            onClick={() => handleSubmit('draft')}
                                        >
                                            Save Draft
                                        </button>
                                        <button
                                            className="px-6 py-2 bg-primary-900 hover:bg-slate-800 text-white font-bold rounded-md text-sm shadow-sm flex items-center gap-2"
                                            onClick={() => handleSubmit('pending')}
                                        >
                                            <Check size={12} /> Submit Course
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {/* --- Bulk Upload Modal --- */}
            {showBulkUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                                <Upload size={20} /> Bulk Upload Courses
                            </h3>
                            <button onClick={closeBulkUpload} className="text-slate-400 hover:text-slate-600">
                                &times;
                            </button>
                        </div>

                        {!bulkUploadResult ? (
                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleBulkFileSelect}
                                        disabled={isBulkUploading}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    />
                                    <div className="space-y-2">
                                        <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Upload size={24} />
                                        </div>
                                        <p className="font-semibold text-slate-700">
                                            {bulkFile ? bulkFile.name : "Click to select CSV file"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Max size 50MB. .csv files only.
                                        </p>
                                    </div>
                                </div>

                                {bulkFile && !isBulkUploading && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleBulkUpload}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors flex items-center gap-2"
                                        >
                                            <Upload size={16} /> Start Upload
                                        </button>
                                    </div>
                                )}

                                {isBulkUploading && (
                                    <div className="space-y-2">

                                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                                            <span>Uploading...</span>
                                            <span>{Math.round(bulkUploadProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full transition-all duration-300"
                                                style={{ width: `${bulkUploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-md ${bulkUploadResult.successCount > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                                    <p className="font-bold">Process Complete</p>
                                    <p className="text-sm mt-1">
                                        Successfully created: <b>{bulkUploadResult.successCount}</b> courses.
                                    </p>
                                </div>

                                {bulkUploadResult.errors?.length > 0 && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 max-h-48 overflow-y-auto">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Errors ({bulkUploadResult.errors.length})</p>
                                        <ul className="space-y-1">
                                            {bulkUploadResult.errors.map((err, i) => (
                                                <li key={i} className="text-xs text-rose-600 flex gap-2">
                                                    <span className="font-mono bg-rose-100 px-1 rounded">{err.row || err.course || '?'}</span>
                                                    <span>{err.message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={closeBulkUpload}
                                        className="bg-primary-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-800 transition-colors"
                                    >
                                        Close & Refresh
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* --- Module Bulk Upload Modal --- */}
            {showModuleBulkUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                                <Upload size={20} /> Bulk Upload Modules
                            </h3>
                            <button onClick={closeModuleBulkUpload} className="text-slate-400 hover:text-slate-600">
                                &times;
                            </button>
                        </div>

                        {!moduleBulkUploadResult ? (
                            <div className="space-y-6">
                                {/* CSV Selection */}
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleModuleBulkFileSelect}
                                        disabled={isModuleBulkUploading}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    />
                                    <div className="space-y-2">
                                        <div className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <FileText size={20} />
                                        </div>
                                        <p className="font-semibold text-slate-700 text-sm">
                                            {moduleBulkFile ? moduleBulkFile.name : "Select CSV File"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Req: module_name, module_type, module_source, module_duration
                                        </p>
                                    </div>
                                </div>

                                {/* Resource Files Selection */}
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleModuleResourceFilesSelect}
                                        disabled={isModuleBulkUploading}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    />
                                    <div className="space-y-2">
                                        <div className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Video size={20} />
                                        </div>
                                        <p className="font-semibold text-slate-700 text-sm">
                                            {moduleResourceFiles.length > 0 ? `${moduleResourceFiles.length} files selected` : "Select Resource Files (Videos/PDFs)"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Select all videos/PDFs referenced in your CSV
                                        </p>
                                    </div>
                                </div>

                                {moduleBulkFile && !isModuleBulkUploading && (
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleModuleBulkUpload}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Upload size={14} /> Start Upload
                                        </button>
                                    </div>
                                )}

                                {isModuleBulkUploading && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                                            <span>Uploading modules...</span>
                                            <span>{Math.round(moduleBulkUploadProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full transition-all duration-300"
                                                style={{ width: `${moduleBulkUploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-md ${moduleBulkUploadResult.successCount > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                                    <p className="font-bold">Process Complete</p>
                                    <p className="text-sm mt-1">
                                        Successfully created: <b>{moduleBulkUploadResult.successCount}</b> modules.
                                    </p>
                                    {moduleBulkUploadResult.totalRows > 0 && (
                                        <p className="text-xs mt-1 text-slate-500">
                                            Processed {moduleBulkUploadResult.totalRows} rows.
                                        </p>
                                    )}
                                </div>

                                {moduleBulkUploadResult.errors?.length > 0 && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 max-h-48 overflow-y-auto">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Errors ({moduleBulkUploadResult.errors.length})</p>
                                        <ul className="space-y-1">
                                            {moduleBulkUploadResult.errors.map((err, i) => (
                                                <li key={i} className="text-xs text-rose-600 flex gap-2">
                                                    <span className="font-mono bg-rose-100 px-1 rounded">Row {err.row}</span>
                                                    <span>{err.message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={closeModuleBulkUpload}
                                        className="bg-primary-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-800 transition-colors"
                                    >
                                        Close & Refresh
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default AddCourseView;
