'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { upsertRecord, deleteRecord, getRecords, MachineWithNumbers } from '@/lib/actions'
import { Machine, Record } from '@prisma/client'
import { PenLine, Calendar, Monitor, Hash, Coins, Save, FileJson, PackagePlus, ListCheck, Inbox, Trash2, RotateCw } from 'lucide-react'

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
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            {/* ページヘッダー */}
            <div className="page-header border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <PenLine size={24} />
                    </div>
                    <div>
                        <h1 className="page-header-title text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">データ入力</h1>
                        <p className="page-header-subtitle text-sm text-[var(--text-muted)]">日々の稼働データを記録・デジタイズ</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 個別入力 */}
                <section className="card-static stagger-item p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
                    <h2 className="text-sm font-bold mb-5 flex items-center gap-2 text-[var(--text-primary)]">
                        <PenLine size={16} className="text-[var(--accent)]" />
                        個別エントリー
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                    <Calendar size={12} /> 日付
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="input-modern tabular-nums"
                                    required
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                    <Monitor size={12} /> 機種
                                </label>
                                <select
                                    value={machineId}
                                    onChange={(e) => handleMachineChange(e.target.value)}
                                    className="select-modern truncate"
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
                                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                    <Hash size={12} /> 台番
                                </label>
                                {machineId ? (
                                    <select
                                        ref={machineNoRef}
                                        value={machineNo}
                                        onChange={(e) => setMachineNo(e.target.value)}
                                        className="select-modern h-[42px] tabular-nums font-medium"
                                        required
                                    >
                                        <option value="">選択</option>
                                        {((machines.find(m => m.id === machineId)?.numbers || []) as any[]).map(n => (
                                            <option key={n.id} value={n.machineNo}>
                                                {n.machineNo}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="input-modern h-[42px] flex items-center justify-center text-xs text-[var(--text-muted)] bg-slate-800/30 border-dashed">
                                        機種未選択
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                    <Coins size={12} /> 差枚
                                </label>
                                <input
                                    type="number"
                                    value={diff}
                                    onChange={(e) => setDiff(e.target.value)}
                                    className="input-modern h-[42px] tabular-nums font-medium"
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 group overflow-hidden relative"
                        >
                            {isPending ? <RotateCw size={16} className="animate-spin" /> : <Save size={16} className="group-hover:scale-110 transition-transform" />}
                            <span>{isPending ? '保存中...' : 'データを保存'}</span>
                        </button>

                        {lastSaved && (
                            <div className="animate-success flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-medium">
                                <div className="p-1 bg-emerald-500/20 rounded-full"><Save size={12} /></div>
                                <div>
                                    <div className="opacity-70 text-[10px] uppercase tracking-wider">Saved Successfully</div>
                                    <div className="tabular-nums">No.{lastSaved.machineNo} / {lastSaved.diff}枚</div>
                                </div>
                            </div>
                        )}
                    </form>
                </section>

                {/* 一括入力 */}
                <section className="card-static stagger-item p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
                    <h2 className="text-sm font-bold mb-5 flex items-center gap-2 text-[var(--text-primary)]">
                        <FileJson size={16} className="text-[var(--accent-secondary)]" />
                        バルクインポート
                    </h2>
                    <div className="space-y-4 h-full flex flex-col">
                        <div className="flex-1 relative">
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                className="input-modern font-mono text-sm h-full w-full min-h-[140px] resize-none p-4 leading-relaxed"
                                placeholder={`238 1500\n239 -500 2000`}
                                style={{ background: 'rgba(15, 23, 42, 0.6)' }}
                            />
                            <div className="absolute top-2 right-2 text-[10px] text-[var(--text-muted)] bg-black/20 px-2 py-1 rounded backdrop-blur">
                                形式: 台番 差枚...
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Calendar size={10} /> 開始日: <span className="text-[var(--text-primary)] tabular-nums">{date}</span>
                            </span>
                            <button
                                onClick={handleBulkSubmit}
                                disabled={isPending || !bulkText}
                                className="btn-primary flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 border-none shadow-lg shadow-teal-500/20"
                            >
                                <PackagePlus size={16} />
                                一括実行
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* 入力済み一覧 */}
            <section className="card-static stagger-item p-0 overflow-hidden border border-white/5">
                <div className="px-5 py-4 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <ListCheck size={18} />
                        <h2 className="text-sm font-bold">データリスト</h2>
                        <span className="text-xs text-[var(--text-muted)] ml-2 tabular-nums bg-white/5 px-2 py-0.5 rounded-full">{date}</span>
                    </div>
                    <div className={`text-sm font-bold glow-value tabular-nums px-3 py-1 rounded-full border ${totalDiff > 0 ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : totalDiff < 0 ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
                        Total: {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-jat w-full">
                        <thead>
                            <tr>
                                <th className="pl-6 w-1/3">機種</th>
                                <th className="text-center w-24">台番</th>
                                <th className="text-right w-32">差枚</th>
                                <th className="text-center w-20">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-[var(--text-muted)]">
                                        <Inbox size={48} className="mx-auto mb-3 opacity-20" />
                                        <div className="text-sm font-medium">No Data Recorded</div>
                                        <div className="text-xs mt-1 opacity-70">フォームからデータを追加してください</div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="pl-6 py-3 text-sm font-medium text-[var(--text-secondary)]">{record.machine.name}</td>
                                        <td className="text-center py-3 text-sm font-bold tabular-nums text-[var(--text-primary)]">{record.machineNo}</td>
                                        <td className="text-right py-3 tabular-nums">
                                            <span className={`font-bold ${record.diff > 0 ? 'text-plus' : record.diff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                {record.diff > 0 ? '+' : ''}{record.diff.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="text-center py-3">
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                disabled={isPending}
                                                title="削除"
                                            >
                                                <Trash2 size={14} />
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
