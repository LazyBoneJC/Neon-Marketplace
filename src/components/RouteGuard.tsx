"use client"

import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface RouteGuardProps {
    children: React.ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
    const { isConnected, address } = useAccount()
    const router = useRouter()
    const [isCompliant, setIsCompliant] = useState<boolean | null>(null)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // If not connected, redirect to home with connect prompt
        if (!isConnected) {
            router.push("/?connect=true")
            return
        }

        // Check compliance
        if (address) {
            checkCompliance(address)
        }
    }, [isConnected, address, router])

    async function checkCompliance(walletAddress: string) {
        setIsChecking(true)
        try {
            const response = await fetch("/api/compliance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: walletAddress }),
            })

            if (!response.ok) {
                throw new Error("Compliance check failed")
            }

            const data = await response.json()
            setIsCompliant(data.success && data.isApproved)
        } catch (error) {
            console.error("Compliance check error:", error)
            setIsCompliant(false)
        } finally {
            setIsChecking(false)
        }
    }

    // Loading state
    if (!isConnected || isChecking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                <p className="text-gray-400 animate-pulse">
                    {!isConnected ? "Redirecting..." : "Verifying compliance status..."}
                </p>
            </div>
        )
    }

    // Access denied state
    if (!isCompliant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
                <div className="max-w-md w-full bg-red-950/20 border border-red-500/30 p-8 rounded-2xl text-center space-y-6 backdrop-blur-sm">
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
                                className="text-red-500"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <line x1="12" x2="12" y1="8" y2="12" />
                                <line x1="12" x2="12.01" y1="16" y2="16" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-red-500 mb-2">
                            Access Denied
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your wallet address has been flagged by our compliance protocols.
                            This feature is not available for your account.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        )
    }

    // Authorized - render children
    return <>{children}</>
}
