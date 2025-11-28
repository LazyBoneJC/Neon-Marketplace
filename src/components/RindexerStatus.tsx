"use client"

export default function RindexerStatus() {
    return (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-700 rounded-full border border-black/10">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium text-gray-300 uppercase tracking-widest">
                Rindexer Live
            </span>
        </div>
    )
}
