"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

interface AIAnalysisResponse {
    analysis: string
    timestamp: string
    isMock?: boolean
    error?: string
}

export default function MarketAnalyst() {
    // Basic Fetcher
    const fetchAnalysis = async (): Promise<AIAnalysisResponse> => {
        const res = await fetch("/api/ai-analyst")
        if (!res.ok) throw new Error("Failed to fetch analysis")
        return res.json()
    }

    // React Query
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["marketAnalysis"],
        queryFn: fetchAnalysis,
        staleTime: 1000 * 60 * 60, // 1 hour stale time (matches API cache)
        retry: 1,
    })

    // Typing effect state
    const [displayedText, setDisplayedText] = useState("")

    useEffect(() => {
        if (data?.analysis) {
            let i = 0
            setDisplayedText("")
            const text = data.analysis
            
            // Simple typing effect
            const intervalId = setInterval(() => {
                setDisplayedText((prev) => prev + text.charAt(i))
                i++
                if (i >= text.length) clearInterval(intervalId)
            }, 20) // Speed of typing

            return () => clearInterval(intervalId)
        }
    }, [data])

    if (isError) {
        return (
            <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-lg">⚠️</span> Analyst Unavailable
                </h3>
                <p className="text-sm text-red-300/70">
                    The AI analyst is currently unavailable. Please try again later.
                </p>
            </div>
        )
    }

    return (
        <div className="relative group overflow-hidden p-[1px] rounded-2xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20">
            {/* Animated Border Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl"></div>
            
            <div className="relative h-full bg-zinc-900/90 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Neon Market Analyst</h3>
                        <p className="text-xs text-gray-500">Powered by Gemini AI • Refreshes hourly</p>
                    </div>
                    {isLoading && (
                        <div className="ml-auto flex items-center gap-2 text-xs text-purple-400">
                            <span className="animate-pulse">Thinking...</span>
                            <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"></div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="min-h-[80px] text-gray-300 leading-relaxed text-sm md:text-base">
                    {isLoading ? (
                         <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-white/5 rounded w-3/4"></div>
                            <div className="h-4 bg-white/5 rounded w-1/2"></div>
                             <div className="h-4 bg-white/5 rounded w-5/6"></div>
                         </div>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <p>{displayedText}</p>
                        </div>
                    )}
                </div>

                 {/* Footer / Mock Indicator */}
                 {data?.isMock && (
                    <div className="text-[10px] text-yellow-500/50 pt-2 border-t border-white/5 mt-auto">
                        MOCK MODE ENABLED
                    </div>
                )}
            </div>
        </div>
    )
}
