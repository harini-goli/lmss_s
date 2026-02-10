import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import { getEmbedUrl } from '../../../utils/urlHelper';
import { Clock, ArrowRight, CheckCircle, Loader2, Play, Pause, RefreshCw } from 'lucide-react';

const TextStreamPlayer = ({ moduleId, url, onComplete }) => {
    const [loading, setLoading] = useState(true);
    const [streamData, setStreamData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [advancing, setAdvancing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const timerRef = useRef(null);

    // If URL indicates HTML or Gamma, render iframe instead of text stream
    // Check this immediately to avoid unnecessary fetch or loading state
    // If URL indicates Gamma, render a professional "Presentation Card"
    if (url && (url.includes("gamma.app"))) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-900 p-6">
                <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center transform transition-all hover:scale-[1.02]">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Play size={40} className="text-indigo-400 ml-1" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Gamma Presentation</h2>
                    <p className="text-slate-400 mb-8">
                        This module contains an interactive presentation hosted on Gamma.
                        Click the button below to view it in a secure new tab.
                    </p>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 group"
                    >
                        View Presentation
                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </a>
                    <div className="mt-8 pt-6 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 italic">
                            External content is opened in a new tab due to security restrictions.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Timer Countdown
    useEffect(() => {
        if (!streamData || streamData.completed || advancing || !isPlaying) return;

        if (timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleNext(); // Trigger next chunk
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0 && !advancing) {
            // Already at 0 (e.g. loaded that way), trigger next
            handleNext();
        }

        return () => clearInterval(timerRef.current);
    }, [timeLeft, streamData, advancing, isPlaying]);

    // Fetch initial stream state
    useEffect(() => {
        let mounted = true;
        const fetchStream = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/modules/${moduleId}/stream`);
                if (mounted) {
                    setStreamData(res.data);
                    // If not completed and has duration, start timer
                    if (!res.data.completed && (res.data.currentChunk || res.data.chunk)) {
                        setTimeLeft((res.data.currentChunk || res.data.chunk).duration_seconds || 60);
                    } else {
                        setTimeLeft(0);
                    }
                }
            } catch (err) {
                console.error("Failed to load stream:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchStream();
        return () => { mounted = false; clearInterval(timerRef.current); };
    }, [moduleId]);

    // Wrap handleNext to be usable in effect
    const handleNext = async () => {
        if (advancing) return;

        try {
            setAdvancing(true);
            const res = await api.post(`/api/modules/${moduleId}/stream/next`);

            if (res.data.completed) {
                setStreamData(prev => ({ ...prev, completed: true }));
                setIsPlaying(false); // Stop playing when done
            } else {
                // Fetch new chunk details
                const nextRes = await api.get(`/api/modules/${moduleId}/stream`);
                setStreamData(nextRes.data);
                if (nextRes.data.currentChunk || nextRes.data.chunk) {
                    setTimeLeft((nextRes.data.currentChunk || nextRes.data.chunk).duration_seconds || 60);
                }
            }
        } catch (err) {
            console.error("Failed to advance stream:", err);
        } finally {
            setAdvancing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="animate-spin mb-2" />
                <p>Loading text stream...</p>
            </div>
        );
    }

    if (!streamData) {
        // Fallback: If stream failed to load (e.g. 404 because no chunks were created) 
        // AND it is an HTML file, show an improved failure UI
        if (url && url.match(/\.html$/i)) {
            return (
                <div className="w-full h-full relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                    <iframe
                        src={getEmbedUrl(url)}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title="Embedded Content"
                    />
                    <div className="absolute bottom-4 right-4 bg-slate-900/80 p-2 rounded text-xs text-slate-400 z-10">
                        <span className="mr-2">Not loading?</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-white underline">
                            Open in new tab
                        </a>
                    </div>
                </div>
            );
        }
        return <div className="text-white p-8">Failed to load content.</div>;
    }

    // Unified View (Streaming builds up the list)
    const chunksToShow = streamData.chunks || (streamData.chunk ? [streamData.chunk] : []);
    const { index, total } = streamData;
    const isCompleted = streamData.completed;

    return (
        <div className="h-full flex flex-col bg-slate-900 text-slate-200 relative">
            {/* Progress Bar Top */}
            {!isCompleted && (
                <div className="h-1 bg-slate-800 w-full flex-shrink-0">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((index + 1) / total) * 100}%` }}
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pb-8">
                <div className="max-w-3xl mx-auto w-full">
                    {/* Continuous Text View */}
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in duration-500 mb-8">
                        <p className="prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap font-serif">
                            {chunksToShow.map((chunk, idx) => (
                                <span key={chunk.chunk_id || idx} className="animate-in fade-in duration-300">
                                    {chunk.content}
                                </span>
                            ))}
                            {/* Typing Indicator if playing */}
                            {isPlaying && !isCompleted && (
                                <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse" />
                            )}
                        </p>
                    </div>

                    {isCompleted && (
                        <div className="flex items-center justify-center gap-3 p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 animate-in zoom-in-50">
                            <CheckCircle size={32} />
                            <h2 className="text-2xl font-bold">Module Completed!</h2>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Player Controls */}
            {!isCompleted && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-slate-800/90 backdrop-blur-md px-8 py-4 rounded-full border border-slate-700 shadow-2xl z-50 transition-all hover:scale-105">
                    {/* Play/Pause Control */}
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="h-8 w-px bg-slate-700"></div>

                    {/* Timer Status */}
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                            {isPlaying ? "Streaming" : "Paused"}
                        </span>
                        <div className="flex items-center gap-2 text-indigo-300 font-mono font-bold text-lg min-w-[100px]">
                            {advancing ? (
                                <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading...</span>
                            ) : (
                                <>
                                    <Clock size={16} />
                                    <span>{timeLeft}s</span>
                                    <span className="text-sm text-slate-500 font-normal">next line</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextStreamPlayer;
