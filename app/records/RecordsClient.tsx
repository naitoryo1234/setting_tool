'use client'

import { useState, useTransition } from 'react'
import { searchRecords, deleteRecord, upsertRecord, MachineWithNumbers } from '@/lib/actions'
import { Record, Machine } from '@prisma/client'
import Link from 'next/link'
import { DatabaseZap, Search, Calendar, Monitor, Hash, Edit2, Trash2, Save, X, RotateCw, ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'

type Props = {
    initialRecords: (Record & { machine: Machine })[]
    machines: MachineWithNumbers[]
}

export default function RecordsClient({ initialRecords, machines }: Props) {
    const [records, setRecords] = useState(initialRecords)
    const [date, setDate] = useState('')
    const [machineId, setMachineId] = useState('')
    const [machineNo, setMachineNo] = useState('')
    const [sortKey, setSortKey] = useState<string>('date')
    const [sortAsc, setSortAsc] = useState(false)
    const [isPending, startTransition] = useTransition()

    // 編集用state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editDiff, setEditDiff] = useState<number>(0)

    const fetchRecords = async () => {
        const dateObj = date ? new Date(date) : undefined
        const res = await searchRecords({
            startDate: dateObj,
            endDate: dateObj,
            machineId: machineId || undefined,
            machineNo: machineNo ? parseInt(machineNo) : undefined
        })
        setRecords(res)
    }

    const handleSearch = () => {
        startTransition(async () => {
            await fetchRecords()
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('削除しますか？')) return
        startTransition(async () => {
            await deleteRecord(id)
            await fetchRecords()
        })
    }

    const startEdit = (record: Record) => {
        setEditingId(record.id)
        setEditDiff(record.diff)
    }

    const cancelEdit = () => {
        setEditingId(null)
    }

    const saveEdit = async (record: Record) => {
        startTransition(async () => {
            const result = await upsertRecord({
                date: record.date,
                machineId: record.machineId,
                machineNo: record.machineNo,
                diff: editDiff,
            })

            if (result.success) {
                setEditingId(null)
                await fetchRecords()
            } else {
                alert(result.error)
            }
        })
    }

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc)
        } else {
            setSortKey(key)
            setSortAsc(key === 'machineNo') // Default asc for machineNo
        }
    }

    const sortedRecords = [...records].sort((a, b) => {
        let va = (a as any)[sortKey]
        let vb = (b as any)[sortKey]

        if (sortKey === 'date') {
            va = new Date(va).getTime()
            vb = new Date(vb).getTime()
        } else if (sortKey === 'machineName') {
            va = a.machine.name
            vb = b.machine.name
        }

        if (va < vb) return sortAsc ? -1 : 1
        if (va > vb) return sortAsc ? 1 : -1
        return 0
    })

    const SortHeader = ({ label, field, align = 'left', className = '' }: { label: string; field: string; align?: string, className?: string }) => (
        <th
            className={`cursor-pointer select-none hover:text-[var(--accent)] transition-colors group ${className}`}
            style={{ textAlign: align as any }}
            onClick={() => handleSort(field)}
        >
            <div className={`flex items-center ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} gap-1`}>
                {label}
                <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent)]">
                    {sortKey === field ? (sortAsc ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} />}
                </span>
            </div>
        </th>
    )

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-4 md:space-y-8">
            {/* ページヘッダー */}
            {/* ページヘッダー */}
            <PageHeader
                title="記録管理"
                subtitle="保存されたデータの確認・修正・削除"
                startAdornment={<DatabaseZap size={20} />}
            />

            <div className="space-y-6">
                {/* 検索・フィルター */}
                <div className="card-static stagger-item p-6 border border-[var(--border-color)] bg-[var(--bg-card)]">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:w-auto">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                                <Calendar size={12} /> 日付
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input-modern tabular-nums"
                            />
                        </div>
                        <div className="w-full sm:flex-1 min-w-[200px]">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                                <Monitor size={12} /> 機種
                            </label>
                            <select
                                value={machineId}
                                onChange={(e) => {
                                    setMachineId(e.target.value)
                                    setMachineNo('')
                                }}
                                className="select-modern w-full text-ellipsis"
                            >
                                <option value="">すべて</option>
                                {machines.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                            </select>
                        </div>
                        <div className="w-full sm:w-32">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                                <Hash size={12} /> 台番
                            </label>
                            <select
                                value={machineNo}
                                onChange={(e) => setMachineNo(e.target.value)}
                                className="select-modern w-full tabular-nums"
                                disabled={!machineId}
                            >
                                <option value="">すべて</option>
                                {((machines.find(m => m.id === machineId)?.numbers || []) as any[]).map(n => (
                                    <option key={n.id} value={n.machineNo}>{n.machineNo}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isPending}
                            className="btn-primary w-full sm:w-auto h-[42px] px-6 flex items-center justify-center gap-2"
                        >
                            {isPending ? <RotateCw size={16} className="animate-spin" /> : <Search size={16} />}
                            <span>検索</span>
                        </button>
                    </div>
                </div>

                {/* データ一覧テーブル */}
                <div className="card-static stagger-item p-0 overflow-hidden border border-[var(--border-color)]">
                    <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] flex justify-between items-center">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">検索結果</h2>
                        <span className="text-xs text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-full tabular-nums">
                            {sortedRecords.length} records
                        </span>
                    </div>
                    {/* モバイル用リスト表示 (2段組み) */}
                    <div className="md:hidden">
                        <div className="flex flex-wrap gap-2 p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                            <button onClick={() => handleSort('date')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${sortKey === 'date' ? 'border-[var(--primary)] text-white bg-[var(--primary)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'}`}>
                                日付 {sortKey === 'date' && <ArrowUpDown size={12} className={`transition-transform duration-300 ${sortAsc ? 'rotate-180' : ''}`} />}
                            </button>
                            <button onClick={() => handleSort('machineName')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${sortKey === 'machineName' ? 'border-[var(--primary)] text-white bg-[var(--primary)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'}`}>
                                機種名 {sortKey === 'machineName' && <ArrowUpDown size={12} className={`transition-transform duration-300 ${sortAsc ? 'rotate-180' : ''}`} />}
                            </button>
                            <button onClick={() => handleSort('machineNo')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${sortKey === 'machineNo' ? 'border-[var(--primary)] text-white bg-[var(--primary)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'}`}>
                                台番 {sortKey === 'machineNo' && <ArrowUpDown size={12} className={`transition-transform duration-300 ${sortAsc ? 'rotate-180' : ''}`} />}
                            </button>
                            <button onClick={() => handleSort('diff')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${sortKey === 'diff' ? 'text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'}`} style={sortKey === 'diff' ? { backgroundColor: sortAsc ? 'var(--color-minus)' : 'var(--color-plus)', borderColor: sortAsc ? 'var(--color-minus)' : 'var(--color-plus)' } : undefined}>
                                差枚 {sortKey === 'diff' && <ArrowUpDown size={12} className={`transition-transform duration-300 ${sortAsc ? 'rotate-180' : ''}`} />}
                            </button>
                        </div>
                        <div className="divide-y divide-[var(--border-color)]">
                            {sortedRecords.length === 0 ? (
                                <div className="py-12">
                                    <EmptyState icon={Inbox} title="データが見つかりません" description="条件を変更して再度検索してください。" className="border-none bg-transparent" />
                                </div>
                            ) : (
                                sortedRecords.map((record) => {
                                    const isEditing = editingId === record.id
                                    const dateStr = new Date(record.date).toLocaleDateString('ja-JP')

                                    return (
                                        <div key={record.id} className={`p-4 ${isEditing ? 'bg-[var(--primary)]/10' : 'active:bg-white/5'} transition-colors`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-xs text-[var(--text-muted)]">{dateStr}</div>
                                                    <div className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                                                        <span>{record.machine.name}</span>
                                                        <Link href={`/history/${record.machineId}/${record.machineNo}`} className="text-[var(--primary)] hover:underline tabular-nums px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-xs text-center border border-[var(--primary)]/20">
                                                            #{record.machineNo}
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editDiff}
                                                            onChange={(e) => setEditDiff(Number(e.target.value))}
                                                            className="input-modern py-1 px-2 text-right w-24 tabular-nums text-sm font-bold"
                                                        />
                                                    ) : (
                                                        <span className={`tabular-nums font-bold text-lg ${record.diff > 0 ? 'text-plus' : record.diff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                            {record.diff > 0 ? '+' : ''}{record.diff.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]/50">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={cancelEdit} className="btn-secondary h-8 px-4 text-xs flex items-center gap-1" disabled={isPending}>
                                                            <X size={14} /> キャンセル
                                                        </button>
                                                        <button onClick={() => saveEdit(record)} className="btn-primary h-8 px-4 text-xs flex items-center gap-1" disabled={isPending}>
                                                            <Save size={14} /> 保存
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleDelete(record.id)} className="h-8 px-3 rounded text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1 text-xs font-semibold">
                                                            <Trash2 size={14} /> 削除
                                                        </button>
                                                        <button onClick={() => startEdit(record)} className="h-8 px-3 rounded text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors flex items-center gap-1 text-xs font-semibold border border-[var(--primary)]/30">
                                                            <Edit2 size={14} /> 編集
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* PC用テーブル表示 */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="table-jat w-full text-sm">
                            <thead>
                                <tr>
                                    <SortHeader label="日付" field="date" className="pl-4" />
                                    <SortHeader label="機種名" field="machineName" />
                                    <SortHeader label="台番" field="machineNo" align="center" />
                                    <SortHeader label="差枚" field="diff" align="right" />
                                    <th className="text-center w-24">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24">
                                            <EmptyState
                                                icon={Inbox}
                                                title="データが見つかりません"
                                                description="条件を変更して再度検索してください。"
                                                className="border-none bg-transparent"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    sortedRecords.map((record) => {
                                        const isEditing = editingId === record.id
                                        const dateStr = new Date(record.date).toLocaleDateString('ja-JP')

                                        return (
                                            <tr key={record.id} className={`${isEditing ? 'bg-[var(--primary)]/10' : 'group hover:bg-white/5'} transition-colors`}>
                                                <td className="pl-4 py-3 tabular-nums text-[var(--text-secondary)]">{dateStr}</td>
                                                <td className="py-3 font-medium text-[var(--text-primary)]">{record.machine.name}</td>
                                                <td className="py-3 text-center">
                                                    <Link href={`/history/${record.machineId}/${record.machineNo}`} className="text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline decoration-[var(--primary)]/30 tabular-nums font-bold">
                                                        {record.machineNo}
                                                    </Link>
                                                </td>

                                                {/* 編集モード: 差枚 */}
                                                <td className="py-3 text-right">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editDiff}
                                                            onChange={(e) => setEditDiff(Number(e.target.value))}
                                                            className="input-modern py-1 px-2 text-right w-24 tabular-nums"
                                                        />
                                                    ) : (
                                                        <span className={`tabular-nums font-bold ${record.diff > 0 ? 'text-plus' : record.diff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                            {record.diff > 0 ? '+' : ''}{record.diff.toLocaleString()}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 操作ボタン */}
                                                <td className="py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={() => saveEdit(record)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary)]/20 rounded disabled:opacity-50" disabled={isPending}>
                                                                    <Save size={14} />
                                                                </button>
                                                                <button onClick={cancelEdit} className="p-1.5 text-[var(--text-muted)] hover:bg-white/10 rounded" disabled={isPending}>
                                                                    <X size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEdit(record)} className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--primary)]/20 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button onClick={() => handleDelete(record.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

