'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { upsertRecord, deleteRecord, getRecords, MachineWithNumbers } from '@/lib/actions'
import { Machine, Record } from '@prisma/client'

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
    const machineNoRef = useRef<HTMLSelectElement>(null)

    // Load last machine from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('lastMachineId')
        if (saved) setMachineId(saved)
    }, [])

    // Save machine to localStorage
    const handleMachineChange = (id: string) => {
        setMachineId(id)
        localStorage.setItem('lastMachineId', id)
        setMachineNo('') // Reset machine no on machine change
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!machineId || !machineNo || !diff) return

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

                // Try to keep focus flow
                // machineNoRef.current?.focus() 
            } else {
                alert(result.error)
            }
        })
    }

    const handleBulkSubmit = async () => {
        if (!machineId || !bulkText) return
        const startDateObj = new Date(date)

        startTransition(async () => {
            let errorCount = 0
            const lines = bulkText.split('\n').filter(l => l.trim())

            for (const line of lines) {
                const parts = line.trim().split(/\s+/)
                if (parts.length < 2) {
                    errorCount++
                    continue
                }
                const machineNo = parseInt(parts[0])
                if (isNaN(machineNo)) {
                    errorCount++
                    continue
                }

                for (let i = 1; i < parts.length; i++) {
                    const diffStr = parts[i]
                    const diff = parseInt(diffStr)
                    if (isNaN(diff)) continue
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
            const newRecords = await getRecords(startDateObj)
            setRecords(newRecords)
            if (errorCount > 0) alert(`${errorCount} 行のエラーがありましたが、他は保存しました。`)
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
        async function fetchRecords() {
            const res = await getRecords(new Date(date))
            setRecords(res)
        }
        fetchRecords()
    }, [date])

    const totalDiff = records.reduce((acc, r) => acc + r.diff, 0)

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Individual Input */}
            <section className="card-static">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span style={{ color: 'var(--accent)' }}>📝</span> 個別入力
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-secondary">日付</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input-modern"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-secondary">機種</label>
                            <select
                                value={machineId}
                                onChange={(e) => handleMachineChange(e.target.value)}
                                className="select-modern"
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-secondary">台番</label>
                            {machineId ? (
                                <select
                                    ref={machineNoRef}
                                    value={machineNo}
                                    onChange={(e) => setMachineNo(e.target.value)}
                                    className="select-modern h-[42px]"
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
                                <div className="input-modern bg-elevated text-muted h-[42px] flex items-center">
                                    機種未選択
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-secondary">差枚</label>
                            <input
                                type="number"
                                value={diff}
                                onChange={(e) => setDiff(e.target.value)}
                                className="input-modern h-[42px]"
                                placeholder="例: 500"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn-primary w-full py-3 text-base"
                    >
                        {isPending ? '保存中...' : '追加 (Enter)'}
                    </button>

                    {lastSaved && (
                        <div className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-2 rounded text-sm text-center animate-fade-in">
                            ✅ 保存完了: 台番 {lastSaved.machineNo} / 差枚 {lastSaved.diff}
                        </div>
                    )}
                </form>
            </section>

            {/* Bulk Input - Collapsible or separate section */}
            <section className="card-static">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span style={{ color: 'var(--accent)' }}>📦</span> 一括入力
                </h2>
                <div className="space-y-4">
                    <p className="text-xs text-muted">
                        形式: 「台番 差枚」または「台番 差枚(当日) 差枚(翌日)...」<br />
                        ※上の「日付」が開始日になります
                    </p>
                    <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        className="input-modern font-mono text-sm"
                        style={{ minHeight: '120px' }}
                        placeholder={`238 1500\n239 -500 2000`}
                    />
                    <div className="text-right">
                        <button
                            onClick={handleBulkSubmit}
                            disabled={isPending || !bulkText}
                            className="btn-primary bg-green-600 hover:bg-green-700"
                        >
                            一括追加
                        </button>
                    </div>
                </div>
            </section>

            {/* Today's Records */}
            <section className="card-static" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-sm">
                            入力済み一覧 ({date})
                        </h2>
                        <span className={`text-sm font-bold ${totalDiff > 0 ? 'text-plus' : totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
                            Total: {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}枚
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-jat w-full">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>機種</th>
                                <th style={{ textAlign: 'center' }}>台番</th>
                                <th style={{ textAlign: 'right' }}>差枚</th>
                                <th style={{ textAlign: 'center' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        データがありません
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id}>
                                        <td style={{ fontSize: '0.85rem' }}>{record.machine.name}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{record.machineNo}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className={record.diff > 0 ? 'text-plus' : record.diff < 0 ? 'text-minus' : 'text-zero'}>
                                                {record.diff > 0 ? '+' : ''}{record.diff.toLocaleString()}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                disabled={isPending}
                                                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
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
