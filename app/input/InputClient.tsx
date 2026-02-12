'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { upsertRecord, deleteRecord, getRecords } from '@/lib/actions'
import { Machine, MachineNumber, Record } from '@prisma/client'

type MachineWithNumbers = Machine & { numbers: MachineNumber[] }

type Props = {
    machines: MachineWithNumbers[]
    todayRecords: (Record & { machine: Machine })[]
    currentDate: string // YYYY-MM-DD
}

export default function InputClient({ machines, todayRecords: initialRecords, currentDate }: Props) {
    const [records, setRecords] = useState(initialRecords)
    const [date, setDate] = useState(currentDate)
    const [machineId, setMachineId] = useState('')
    const [machineNo, setMachineNo] = useState('')
    const [diff, setDiff] = useState('')
    const [bulkText, setBulkText] = useState('')
    const [isPending, startTransition] = useTransition()
    const [lastSaved, setLastSaved] = useState<{ machineNo: string; diff: string } | null>(null)

    // Load last machine from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('lastMachineId')
        if (saved) setMachineId(saved)
    }, [])

    // Save machine to localStorage
    const handleMachineChange = (id: string) => {
        setMachineId(id)
        localStorage.setItem('lastMachineId', id)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!machineId || !machineNo || !diff) return

        const d = new Date(date)
        // Adjust to local midnight if needed, but 'new Date("YYYY-MM-DD")' is UTC midnight in some contexts and Local in others?
        // In Browser, new Date("2023-01-01") is UTC. new Date(2023, 0, 1) is Local.
        // However, input type=date value is "YYYY-MM-DD".
        // We will pass the date object created from this string.
        // To ensure consistency, let's treat the Input Date as the anchor.

        startTransition(async () => {
            const result = await upsertRecord({
                date: new Date(date),
                machineId,
                machineNo: parseInt(machineNo),
                diff: parseInt(diff),
            })
            if (result.success) {
                setLastSaved({ machineNo, diff })
                setMachineNo('')
                setDiff('')
                // Refresh records for the date
                const newRecords = await getRecords(new Date(date))
                setRecords(newRecords)

                // Focus back to machineNo?
                document.getElementById('machineNo')?.focus()
            } else {
                alert(result.error)
            }
        })
    }

    const handleBulkSubmit = async () => {
        if (!machineId || !bulkText) return

        // Use the selected date as the start date for the bulk input sequences
        const startDateObj = new Date(date)

        startTransition(async () => {
            let errorCount = 0
            const lines = bulkText.split('\n').filter(l => l.trim())

            for (const line of lines) {
                // format: "MachineNo DiffDay1 DiffDay2 DiffDay3 ..."
                // e.g., "299 1500 0 500" -> 
                // 299: Day1=1500, Day2=0, Day3=500
                const parts = line.trim().split(/\s+/)

                if (parts.length < 2) {
                    console.error('Invalid line:', line)
                    errorCount++
                    continue
                }

                const machineNo = parseInt(parts[0])
                if (isNaN(machineNo)) {
                    errorCount++
                    continue
                }

                // Process each diff column
                for (let i = 1; i < parts.length; i++) {
                    const diffStr = parts[i]
                    const diff = parseInt(diffStr)
                    if (isNaN(diff)) continue // skip invalid diffs

                    // Calculate date for this column: startDate + (i-1) days
                    const targetDate = new Date(startDateObj)
                    targetDate.setDate(startDateObj.getDate() + (i - 1))

                    await upsertRecord({
                        date: targetDate,
                        machineId,
                        machineNo,
                        diff,
                    })
                }
            }
            setBulkText('')

            // Refresh records for the start date
            const newRecords = await getRecords(startDateObj)
            setRecords(newRecords)

            if (errorCount > 0) alert(`${errorCount} 行のエラー(または不正なフォーマット)がありましたが、他は保存しました。`)
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('削除しますか？')) return
        startTransition(async () => {
            await deleteRecord(id)
            const newRecords = await getRecords(new Date(date))
            setRecords(newRecords)
        })
    }

    // Fetch records when date changes
    useEffect(() => {
        // Skip initial load if date matches initial
        async function fetchRecords() {
            const res = await getRecords(new Date(date))
            setRecords(res)
        }
        fetchRecords()
    }, [date])

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Individual Input */}
            <section className="bg-white p-6 rounded shadow">
                <h2 className="text-lg font-bold mb-4">個別入力</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="block text-sm font-medium mb-1">日付</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border p-2 rounded"
                                required
                            />
                        </div>
                        <div className="w-2/3">
                            <label className="block text-sm font-medium mb-1">機種</label>
                            <select
                                value={machineId}
                                onChange={(e) => handleMachineChange(e.target.value)}
                                className="w-full border p-2 rounded"
                                required
                            >
                                <option value="">選択してください</option>
                                {machines.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="block text-sm font-medium mb-1">台番</label>
                            {machineId ? (
                                <select
                                    id="machineNo"
                                    value={machineNo}
                                    onChange={(e) => setMachineNo(e.target.value)}
                                    className="w-full border p-2 rounded"
                                    required
                                >
                                    <option value="">選択</option>
                                    {machines.find(m => m.id === machineId)?.numbers.map(n => (
                                        <option key={n.id} value={n.machineNo}>
                                            {n.machineNo}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    disabled
                                    className="w-full border p-2 rounded bg-gray-100"
                                    placeholder="機種を選択"
                                />
                            )}
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium mb-1">差枚</label>
                            <input
                                type="number"
                                value={diff}
                                onChange={(e) => setDiff(e.target.value)}
                                className="w-full border p-2 rounded"
                                placeholder="例: 500"
                                required
                            />
                        </div>
                        <div className="w-1/3 flex items-end">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isPending ? '保存中...' : '追加 (Enter)'}
                            </button>
                        </div>
                    </div>
                    {lastSaved && (
                        <p className="text-sm text-green-600">
                            保存完了: 台番 {lastSaved.machineNo} / 差枚 {lastSaved.diff}
                        </p>
                    )}
                </form>
            </section>

            {/* Bulk Input */}
            <section className="bg-white p-6 rounded shadow">
                <h2 className="text-lg font-bold mb-4">一括入力 (台番 差枚1 差枚2...)</h2>
                <p className="text-sm text-gray-600 mb-2">
                    「台番 差枚」または「台番 差枚(当日) 差枚(翌日) 差枚(翌々日)...」の形式で入力。<br />
                    上の「日付」で指定した日が開始日となります。
                </p>
                <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full border p-2 rounded h-32 font-mono"
                    placeholder={`299 1500 0 500\n300 0 0 -2000`}
                />
                <div className="mt-2 text-right">
                    <button
                        onClick={handleBulkSubmit}
                        disabled={isPending || !bulkText}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        一括追加
                    </button>
                </div>
            </section>

            {/* Today's Records */}
            <section className="bg-white p-6 rounded shadow">
                <h2 className="text-lg font-bold mb-4">
                    入力済み一覧 ({date}) Total: {records.reduce((acc, r) => acc + r.diff, 0)}枚
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 uppercase">
                            <tr>
                                <th className="px-4 py-3">機種</th>
                                <th className="px-4 py-3">台番</th>
                                <th className="px-4 py-3 text-right">差枚</th>
                                <th className="px-4 py-3 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="border-b">
                                        <td className="px-4 py-3">{record.machine.name}</td>
                                        <td className="px-4 py-3">{record.machineNo}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${record.diff > 0 ? 'text-red-500' : record.diff < 0 ? 'text-blue-500' : ''}`}>
                                            {record.diff > 0 ? '+' : ''}{record.diff}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="text-red-600 hover:text-red-800"
                                                disabled={isPending}
                                            >
                                                削除
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
