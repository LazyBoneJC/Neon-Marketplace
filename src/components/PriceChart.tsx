"use client"

// 1. 這裡多引入了 AreaSeries
import { createChart, ColorType, IChartApi, AreaSeries } from "lightweight-charts"
import React, { useEffect, useRef } from "react"

const generateData = (numberOfCandles = 500) => {
    let date = new Date()
    date.setDate(date.getDate() - numberOfCandles)

    let value = 100
    const data = []

    for (let i = 0; i < numberOfCandles; i++) {
        const dateStr = date.toISOString().split("T")[0]
        const volatility = (Math.random() - 0.48) * 4
        value = value + volatility

        data.push({ time: dateStr, value: value })
        date.setDate(date.getDate() + 1)
    }
    return data
}

export default function PriceChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)

    useEffect(() => {
        if (!chartContainerRef.current) return

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#9CA3AF",
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            grid: {
                vertLines: { color: "rgba(197, 203, 206, 0.1)" },
                horzLines: { color: "rgba(197, 203, 206, 0.1)" },
            },
            rightPriceScale: {
                borderVisible: false,
            },
            timeScale: {
                borderVisible: false,
            },
        })

        chartRef.current = chart

        // 2. 這裡改成 addSeries(AreaSeries, options) 的寫法
        const newSeries = chart.addSeries(AreaSeries, {
            lineColor: "#8B5CF6",
            topColor: "rgba(139, 92, 246, 0.5)",
            bottomColor: "rgba(139, 92, 246, 0.0)",
            lineWidth: 2,
        })

        const initialData = generateData(100)
        newSeries.setData(initialData)

        const interval = setInterval(() => {
            const lastData = initialData[initialData.length - 1]
            const move = (Math.random() - 0.5) * 2
            const newValue = lastData.value + move

            // 更新數據
            newSeries.update({
                time: lastData.time,
                value: newValue,
            })
        }, 1000)

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            clearInterval(interval)
            chart.remove()
        }
    }, [])

    return (
        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        Floor Price History
                    </h3>
                    <p className="text-sm text-gray-500">Average price over last 30 days</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-bold rounded">
                        +12.5%
                    </span>
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-600 text-xs font-bold rounded animate-pulse">
                        LIVE
                    </span>
                </div>
            </div>
            <div ref={chartContainerRef} className="w-full" />
        </div>
    )
}
