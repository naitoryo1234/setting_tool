'use client'

import { useState, useTransition } from 'react'
import { getSummary, MachineSummary, MachineNoSummary } from '@/lib/actions'
import { Machine } from '@prisma/client'

type Props = {
    machines: Machine[]
}

export default function SummaryClient({ machines }: Props) {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [machineSummary, setMachineSummary] = useState<MachineSummary[]>([])
    const [machineNoSummary, setMachineNoSummary] = useState<MachineNoSummary[]>([])
    const [selectedMachineId, setSelectedMachineId] = useState('')
    const [isPending, startTransition] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = () => {
        startTransition(async () => {
            const result = await getSummary(new Date(startDate), new Date(endDate))
            setMachineSummary(result.machineSummary)
            setMachineNoSummary(result.machineNoSummary)
            setHasSearched(true)
        })
    }

    const handleSortMachine = (key: 'totalDiff' | 'count' | 'machineName') => {
        const sorted = [...machineSummary].sort((a, b) => {
            if (key === 'machineName') return a.machineName.localeCompare(b.machineName)
            return b[key] - a[key]
        })
        setMachineSummary(sorted)
    }

    const handleSortMachineNo = (key: 'totalDiff' | 'count' | 'machineNo') => {
        const sorted = [...machineNoSummary].sort((a, b) => {
            if (key === 'machineNo') return a.machineNo - b.machineNo
            return b[key] - a[key]
        })
        setMachineNoSummary(sorted)
    }

    const filteredMachineNoSummary = selectedMachineId
        ? machineNoSummary.filter(m => m.machineId === selectedMachineId)
        : machineNoSummary

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded shadow flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium mb-1">開始日</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">終了日</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending ? '集計中...' : '集計'}
                </button>
            </div>

            {hasSearched && (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Machine Summary */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-lg font-bold mb-4">機種別合計</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 uppercase">
                                    <tr>
                                        <th
                                            className="px-4 py-3 cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSortMachine('machineName')}
                                        >
                                            機種
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSortMachine('totalDiff')}
                                        >
                                            差枚
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSortMachine('count')}
                                        >
                                            件数
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {machineSummary.map((m) => (
                                        <tr key={m.machineId} className="border-b">
                                            <td className="px-4 py-3">{m.machineName}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${m.totalDiff > 0 ? 'text-red-500' : m.totalDiff < 0 ? 'text-blue-500' : ''}`}>
                                                {m.totalDiff > 0 ? '+' : ''}{m.totalDiff}
                                            </td>
                                            <td className="px-4 py-3 text-right">{m.count}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="px-4 py-3">合計</td>
                                        <td className={`px-4 py-3 text-right ${machineSummary.reduce((a, b) => a + b.totalDiff, 0) > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {machineSummary.reduce((a, b) => a + b.totalDiff, 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right">{machineSummary.reduce((a, b) => a + b.count, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MachineNo Summary */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-lg font-bold mb-4">台別合計</h2>
                        <div className="mb-4">
                            <select
                                value={selectedMachineId}
                                onChange={(e) => setSelectedMachineId(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">全機種</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 uppercase sticky top-0">
                                    <tr>
                                        <th
                                            className="px-4 py-3 cursor-pointer hover:bg-gray-200"
                                        >
                                            機種
                                        </th>
                                        <th
                                            className="px-4 py-3 cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSortMachineNo('machineNo')}
                                        >
                                            台番
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSortMachineNo('totalDiff')}
                                        >
                                            差枚
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMachineNoSummary.map((m) => (
                                        <tr key={`${m.machineId}-${m.machineNo}`} className="border-b">
                                            <td className="px-4 py-3">{m.machineName}</td>
                                            <td className="px-4 py-3">{m.machineNo}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${m.totalDiff > 0 ? 'text-red-500' : m.totalDiff < 0 ? 'text-blue-500' : ''}`}>
                                                {m.totalDiff > 0 ? '+' : ''}{m.totalDiff}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
