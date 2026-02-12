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
                const newRecords = await getRecords(new Date(date))
                setRecords(newRecords)
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
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* ページヘッダー */}
            <div className="page-header">
                <h1 className="page-header-title">📝 データ入力</h1>
                <p className="page-header-subtitle">日別の結果を記録する</p>
            </div>

            <div className="space-y-6">
                {/* 個別入力 */}
                <section className="card-static stagger-item">
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                        <span style={{ color: 'var(--accent)' }}>✏️</span> 個別入力
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>日付</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="input-modern"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>機種</label>
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
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>台番</label>
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
                                    <div className="input-modern h-[42px] flex items-center" style={{ color: 'var(--text-muted)', background: 'rgba(30,41,59,0.3)' }}>
                                        機種未選択
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>差枚</label>
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
                            {isPending ? '保存中...' : '💾 追加 (Enter)'}
                        </button>

                        {lastSaved && (
                            <div className="animate-success" style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                color: '#4ade80',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.875rem',
                                textAlign: 'center',
                            }}>
                                ✅ 保存完了: 台番 {lastSaved.machineNo} / 差枚 {lastSaved.diff}
                            </div>
                        )}
                    </form>
                </section>

                {/* 一括入力 */}
                <section className="card-static stagger-item">
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                        <span style={{ color: 'var(--accent-secondary)' }}>📦</span> 一括入力
                    </h2>
                    <div className="space-y-4">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
                                className="btn-primary"
                                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                            >
                                📥 一括追加
                            </button>
                        </div>
                    </div>
                </section>

                {/* 入力済み一覧 */}
                <section className="card-static stagger-item" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(15, 23, 42, 0.5)',
                    }}>
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>
                                📋 入力済み一覧 ({date})
                            </h2>
                            <span className={`text-sm font-bold glow-value ${totalDiff > 0 ? 'text-plus' : totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
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
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                                            <div>データがありません</div>
                                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>上のフォームからデータを追加してください</div>
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
                                                    className="transition-colors"
                                                    disabled={isPending}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '6px',
                                                        color: '#f87171',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    }}
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
        </div>
    )
}
