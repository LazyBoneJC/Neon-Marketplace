"use client"

import { useState, useCallback, useRef, useEffect } from "react"

// ============== Types ==============
export interface ChatMessage {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: Date
    // For assistant messages that include actions
    action?: {
        type: "list_nft" | "market_data" | "risk_check"
        params: Record<string, unknown>
        status: "pending" | "confirmed" | "cancelled"
    }
}

interface UseChatbotOptions {
    /** Initial system prompt context */
    systemContext?: string
    /** Enable local storage persistence */
    persist?: boolean
    /** User's connected wallet address */
    userAddress?: string
}

interface UseChatbotReturn {
    messages: ChatMessage[]
    isLoading: boolean
    error: string | null
    sendMessage: (content: string) => Promise<void>
    clearHistory: () => void
    retryLastMessage: () => Promise<void>
}

// ============== Storage Helpers ==============
const STORAGE_KEY = "neon-chatbot-history"

function loadMessagesFromStorage(): ChatMessage[] {
    if (typeof window === "undefined") return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.map((m: ChatMessage) => ({
                ...m,
                timestamp: new Date(m.timestamp),
            }))
        }
    } catch (e) {
        console.error("Failed to load chat history:", e)
    }
    return []
}

function saveMessagesToStorage(messages: ChatMessage[]) {
    if (typeof window === "undefined") return
    try {
        // Only keep last 50 messages to save space
        const toSave = messages.slice(-50)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
        console.error("Failed to save chat history:", e)
    }
}

// ============== Hook ==============
export function useChatbot(options: UseChatbotOptions = {}): UseChatbotReturn {
    const { persist = false, userAddress } = options

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Track last user message for retry
    const lastUserMessageRef = useRef<string | null>(null)

    // Load from storage on mount (only if persist enabled)
    useEffect(() => {
        if (persist) {
            const stored = loadMessagesFromStorage()
            if (stored.length > 0) {
                setMessages(stored)
            }
        }
    }, [persist])

    // Save to storage when messages change
    useEffect(() => {
        if (persist && messages.length > 0) {
            saveMessagesToStorage(messages)
        }
    }, [messages, persist])

    // Generate unique ID
    const generateId = useCallback(() => {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }, [])

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return

            setError(null)
            lastUserMessageRef.current = content

            // Add user message
            const userMessage: ChatMessage = {
                id: generateId(),
                role: "user",
                content: content.trim(),
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, userMessage])
            setIsLoading(true)

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: content.trim(),
                        // Send last 10 messages as context
                        history: messages.slice(-10).map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                        // Send wallet address for validation
                        userContext: {
                            address: userAddress,
                        },
                    }),
                })

                if (!response.ok) {
                    const errData = await response.json()
                    throw new Error(errData.message || "Failed to get response")
                }

                const data = await response.json()

                // Add assistant message
                const assistantMessage: ChatMessage = {
                    id: generateId(),
                    role: "assistant",
                    content: data.response,
                    timestamp: new Date(),
                    action: data.action,
                }

                setMessages((prev) => [...prev, assistantMessage])
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An error occurred"
                setError(errorMessage)
                console.error("Chat error:", err)
            } finally {
                setIsLoading(false)
            }
        },
        [isLoading, messages, generateId]
    )

    const clearHistory = useCallback(() => {
        setMessages([])
        setError(null)
        if (persist) {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [persist])

    const retryLastMessage = useCallback(async () => {
        if (lastUserMessageRef.current) {
            // Remove last assistant message if it exists
            setMessages((prev) => {
                if (prev.length > 0 && prev[prev.length - 1].role === "assistant") {
                    return prev.slice(0, -1)
                }
                return prev
            })
            // Also remove the last user message since sendMessage will add it again
            setMessages((prev) => {
                if (prev.length > 0 && prev[prev.length - 1].role === "user") {
                    return prev.slice(0, -1)
                }
                return prev
            })
            await sendMessage(lastUserMessageRef.current)
        }
    }, [sendMessage])

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearHistory,
        retryLastMessage,
    }
}
