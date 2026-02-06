"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { useChatbot, ChatMessage } from "@/hooks/useChatbot"
import TransactionPreview from "@/components/AI/TransactionPreview"

// ============== Sub-components ==============

// Floating Action Button
function ChatFAB({ onClick, hasUnread }: { onClick: () => void; hasUnread?: boolean }) {
    return (
        <button
            onClick={onClick}
            className="
                fixed bottom-6 right-6 z-50
                w-14 h-14 rounded-full
                bg-gradient-to-br from-purple-600 to-blue-600
                hover:from-purple-500 hover:to-blue-500
                shadow-lg shadow-purple-500/30
                flex items-center justify-center
                transition-all duration-300 ease-out
                hover:scale-110 active:scale-95
                group
            "
            aria-label="Open AI Chat"
        >
            {/* AI Icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white group-hover:rotate-12 transition-transform"
            >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
            </svg>

            {/* Notification dot */}
            {hasUnread && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse" />
            )}
        </button>
    )
}

// Single Message Bubble
function MessageBubble({ 
    message, 
    onActionConfirm,
    onActionCancel 
}: { 
    message: ChatMessage
    onActionConfirm?: (action: ChatMessage["action"]) => void
    onActionCancel?: () => void
}) {
    const isUser = message.role === "user"

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
            <div
                className={`
                    max-w-[85%] px-4 py-3 rounded-2xl
                    ${message.action ? "p-0 bg-transparent border-0" : ""}
                    ${
                        isUser
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-md"
                            : message.action ? "" : "bg-zinc-800 text-gray-200 rounded-bl-md border border-zinc-700"
                    }
                `}
            >
                {/* Message content with markdown-like bold support */}
                {!message.action && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                        {message.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                            i % 2 === 1 ? (
                                <strong key={i} className="font-semibold text-white">
                                    {part}
                                </strong>
                            ) : (
                                // Handle long addresses/hashes by adding word break
                                <span key={i}>{part}</span>
                            )
                        )}
                    </p>
                )}

                {/* Full TransactionPreview for pending actions */}
                {message.action && message.action.status === "pending" && (
                    <div className="max-w-[300px]">
                        <p className="text-sm text-gray-300 mb-3 px-4 pt-3">
                            {message.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                                i % 2 === 1 ? (
                                    <strong key={i} className="font-semibold text-white">
                                        {part}
                                    </strong>
                                ) : (
                                    part
                                )
                            )}
                        </p>
                        <TransactionPreview
                            action={message.action as { type: "list_nft" | "market_data" | "risk_check"; params: Record<string, unknown> }}
                            onConfirm={() => onActionConfirm?.(message.action)}
                            onCancel={() => onActionCancel?.()}
                        />
                    </div>
                )}

                {/* Timestamp - only for non-action messages */}
                {!message.action && (
                    <p
                        className={`text-[10px] mt-1 ${isUser ? "text-purple-200/60" : "text-zinc-500"}`}
                    >
                        {message.timestamp.toLocaleTimeString("zh-TW", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                )}
            </div>
        </div>
    )
}

// Typing indicator
function TypingIndicator() {
    return (
        <div className="flex justify-start mb-3">
            <div className="bg-zinc-800 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-md border border-zinc-700">
                <div className="flex items-center gap-1">
                    <span
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                    />
                    <span
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                    />
                    <span
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                    />
                </div>
            </div>
        </div>
    )
}

// Chat Input Box
function ChatInput({
    onSend,
    isLoading,
    placeholder,
    hint,
}: {
    onSend: (message: string) => void
    isLoading: boolean
    placeholder: string
    hint: string
}) {
    const [input, setInput] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = useCallback(() => {
        if (input.trim() && !isLoading) {
            onSend(input.trim())
            setInput("")
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
            }
        }
    }, [input, isLoading, onSend])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        const textarea = e.target
        textarea.style.height = "auto"
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }

    return (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    disabled={isLoading}
                    className="
                        flex-1 bg-zinc-800 border border-zinc-700 rounded-xl
                        px-4 py-3 text-sm text-white placeholder:text-zinc-500
                        resize-none overflow-hidden
                        focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all
                    "
                />
                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading}
                    className="
                        w-11 h-11 rounded-xl
                        bg-gradient-to-br from-purple-600 to-blue-600
                        hover:from-purple-500 hover:to-blue-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center
                        transition-all active:scale-95
                    "
                    aria-label="Send message"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                    >
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                    </svg>
                </button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-2 text-center">
                {hint}
            </p>
        </div>
    )
}

// ============== Types ==============
type Language = "zh" | "en"

// Bilingual UI text
const UI_TEXT = {
    zh: {
        title: "Neon 助手",
        connected: "已連接",
        notConnected: "未連接錢包",
        emptyTitle: "嗨！我是 Neon 助手 👋",
        emptyDesc: "我可以幫你查詢市場行情、上架 NFT、或檢查錢包安全",
        quickActions: ["查詢價格", "幫我上架", "檢查安全"],
        placeholder: "輸入訊息...",
        enterHint: "按 Enter 發送 · Shift+Enter 換行",
        clearChat: "清除對話",
    },
    en: {
        title: "Neon Assistant",
        connected: "Connected",
        notConnected: "Wallet not connected",
        emptyTitle: "Hey! I'm Neon Assistant 👋",
        emptyDesc: "I can help you check market trends, list NFTs, or verify wallet security",
        quickActions: ["Check Prices", "List NFT", "Security Check"],
        placeholder: "Type a message...",
        enterHint: "Press Enter to send · Shift+Enter for newline",
        clearChat: "Clear chat",
    },
}

// ============== Main Component ==============
export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [lang, setLang] = useState<Language>("en")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { address } = useAccount()
    const router = useRouter()

    // Initialize language from localStorage or browser
    useEffect(() => {
        const saved = localStorage.getItem("neon_chat_lang") as Language | null
        if (saved) {
            setLang(saved)
        } else {
            // Detect from browser
            const browserLang = navigator.language.toLowerCase()
            setLang(browserLang.startsWith("zh") ? "zh" : "en")
        }
    }, [])

    // Toggle language
    const toggleLang = useCallback(() => {
        const newLang = lang === "zh" ? "en" : "zh"
        setLang(newLang)
        localStorage.setItem("neon_chat_lang", newLang)
    }, [lang])

    const t = UI_TEXT[lang]

    const { messages, isLoading, error, sendMessage, clearHistory } = useChatbot({
        persist: true,
        userAddress: address, // Pass wallet address for action validation
    })

    // Handle action confirmation (e.g., list NFT)
    const handleActionConfirm = useCallback((action: ChatMessage["action"]) => {
        if (action?.type === "list_nft") {
            // Navigate to list-nft page with pre-filled params
            // In a full implementation, we'd pass the params via query string or state
            router.push("/list-nft")
            setIsOpen(false)
        }
    }, [router])

    // Handle action cancellation with bilingual support
    const handleActionCancel = useCallback(() => {
        const cancelMessage = lang === "zh" ? "取消操作" : "Cancel action"
        sendMessage(cancelMessage)
    }, [sendMessage, lang])

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isLoading])

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false)
        }
        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [])


    return (
        <>
            {/* FAB Button */}
            <ChatFAB onClick={() => setIsOpen(true)} />

            {/* Backdrop + Drawer */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Chat Drawer */}
                    <div
                        className="
                            fixed bottom-0 right-0 z-50
                            w-full h-[90vh] max-h-[700px]
                            sm:w-[400px] sm:h-[600px] sm:bottom-6 sm:right-6
                            md:w-[420px]
                            bg-zinc-900 border border-zinc-800 
                            rounded-t-2xl sm:rounded-2xl
                            shadow-2xl shadow-black/50
                            flex flex-col
                            animate-slide-up
                            overflow-hidden
                        "
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">AI</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">
                                        {t.title}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500">
                                        {address
                                            ? `${t.connected} ${address.slice(0, 6)}...${address.slice(-4)}`
                                            : t.notConnected}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Language Toggle */}
                                <button
                                    onClick={toggleLang}
                                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors"
                                    title={lang === "zh" ? "Switch to English" : "切換至中文"}
                                >
                                    {lang === "zh" ? "EN" : "中"}
                                </button>

                                {/* Clear History */}
                                <button
                                    onClick={clearHistory}
                                    className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    title={t.clearChat}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {/* Empty state */}
                            {messages.length === 0 && !isLoading && (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            className="text-purple-400"
                                        >
                                            <path d="M12 8V4H8" />
                                            <rect width="16" height="12" x="4" y="8" rx="2" />
                                            <path d="M2 14h2" />
                                            <path d="M20 14h2" />
                                            <path d="M15 13v2" />
                                            <path d="M9 13v2" />
                                        </svg>
                                    </div>
                                    <h4 className="text-white font-medium mb-2">
                                        {t.emptyTitle}
                                    </h4>
                                    <p className="text-sm text-zinc-500 mb-4">
                                        {t.emptyDesc}
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {t.quickActions.map((text) => (
                                            <button
                                                key={text}
                                                onClick={() => sendMessage(text)}
                                                className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700 hover:border-purple-500 hover:text-purple-300 transition-colors"
                                            >
                                                {text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {messages.map((msg) => (
                                <MessageBubble 
                                    key={msg.id} 
                                    message={msg}
                                    onActionConfirm={handleActionConfirm}
                                    onActionCancel={handleActionCancel}
                                />
                            ))}

                            {/* Loading indicator */}
                            {isLoading && <TypingIndicator />}

                            {/* Error message */}
                            {error && (
                                <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* Scroll anchor */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <ChatInput 
                            onSend={sendMessage} 
                            isLoading={isLoading}
                            placeholder={t.placeholder}
                            hint={t.enterHint}
                        />
                    </div>
                </>
            )}
        </>
    )
}

