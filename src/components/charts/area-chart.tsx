
"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface AreaChartProps {
    data: { date: string, count: number }[]
    title: string
    color?: string
}

export function AreaChart({ data, title, color = "#10b981" }: AreaChartProps) {
    const series = [{
        name: "Trips",
        data: data.map(d => d.count)
    }]

    const options: ApexOptions = {
        chart: {
            type: "area",
            toolbar: { show: false },
            fontFamily: 'inherit',
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        xaxis: {
            categories: data.map(d => d.date),
            type: 'category'
        },
        colors: [color],
        title: {
            text: title,
            align: 'left',
            style: { fontSize: '16px', fontWeight: 600 }
        },
        grid: {
            borderColor: '#f1f5f9'
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100]
            }
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm h-full">
            <Chart options={options} series={series} type="area" height={350} />
        </div>
    )
}
