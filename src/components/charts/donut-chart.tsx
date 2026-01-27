
"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface DonutChartProps {
    data: { name: string, count: number }[]
    title: string
}

export function DonutChart({ data, title }: DonutChartProps) {
    const series = data.map(d => d.count)
    const labels = data.map(d => d.name)

    const options: ApexOptions = {
        chart: {
            type: "donut",
            fontFamily: 'inherit'
        },
        labels: labels,
        title: {
            text: title,
            align: 'left',
            style: { fontSize: '16px', fontWeight: 600 }
        },
        legend: {
            position: 'bottom'
        },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    }

    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm h-full">
            <Chart options={options} series={series} type="donut" height={350} />
        </div>
    )
}
