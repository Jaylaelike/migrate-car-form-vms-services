
"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface BarChartProps {
    data: { name: string, count: number }[]
    title: string
    color?: string
}

export function BarChart({ data, title, color = "#3b82f6" }: BarChartProps) {
    const series = [{
        name: "Trips",
        data: data.map(d => d.count)
    }]

    const options: ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            fontFamily: 'inherit'
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                distributed: false
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: data.map(d => d.name),
        },
        colors: [color],
        title: {
            text: title,
            align: 'left',
            style: { fontSize: '16px', fontWeight: 600 }
        },
        grid: {
            borderColor: '#f1f5f9'
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm h-full">
            <Chart options={options} series={series} type="bar" height={350} />
        </div>
    )
}
