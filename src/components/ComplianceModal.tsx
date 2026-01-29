"use client"

import { useDisconnect } from "wagmi"
import { useEffect, useRef } from "react"

interface ComplianceModalProps {
    onClose?: () => void
}

export default function ComplianceModal({ onClose }: ComplianceModalProps) {
    const { disconnect } = useDisconnect()
    const modalRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const handleDisconnect = () => {
        disconnect()
        onClose?.()
    }

    // Keyboard accessibility: Escape key to close
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleDisconnect()
            }
        }

        // Focus trap: focus the button when modal opens
        buttonRef.current?.focus()

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            className="fixed inset-0 backdrop-blur-md bg-black/50 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compliance-modal-title"
        >
            <div
                ref={modalRef}
                className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-500"
                            aria-hidden="true"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <line x1="12" x2="12" y1="8" y2="12" />
                            <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                    </div>
                </div>

                {/* Title & Message */}
                <div>
                    <h2
                        id="compliance-modal-title"
                        className="text-2xl font-bold text-red-500 mb-2"
                    >
                        Access Restricted
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        We are sorry, but your wallet address has been flagged by our
                        compliance protocols. Trading features are currently disabled for
                        this account.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        ref={buttonRef}
                        onClick={handleDisconnect}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                    >
                        Disconnect Wallet
                    </button>
                    <p className="text-gray-500 text-xs">
                        You can still browse NFTs and view market data.
                    </p>
                </div>
            </div>
        </div>
    )
}
