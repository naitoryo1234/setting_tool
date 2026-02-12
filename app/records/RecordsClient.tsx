'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { searchRecords, updateRecord, deleteRecord } from '@/lib/actions'
import { Machine, Record } from '@prisma/client'

type Props = {
    machines: Machine[]
}

type RecordWithMachine = Record & {
    machine: Machine
    big?: number | null
    reg?: number | null
    games?: number | null
}

export default function RecordsClient({ machines }: Props) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [machineId, setMachineId] = useState('')
    const [machineNo, setMachineNo] = useState('')

    const [records, setRecords] = useState<RecordWithMachine[]>([])
    const [isPending, startTransition] = useTransition()

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValues, setEditValues] = useState<{
        date: string
        machineId: string
        machineNo: string
        diff: string
        big: string
        reg: string
        games: string
    } | null>(null)

    const handleSearch = () => {
        startTransition(async () => {
            const res = await searchRecords({
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                machineId: machineId || undefined,
                machineNo: machineNo ? parseInt(machineNo) : undefined,
            })
            setRecords(res)
        })
    }

    // Initial load (last 7 days)
    useEffect(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 7)
        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end.toISOString().split('T')[0])
    }, [])

    const handleEditClick = (record: RecordWithMachine) => {
        setEditingId(record.id)
        setEditValues({
            date: new Date(record.date).toISOString().split('T')[0],
            machineId: record.machineId,
            machineNo: record.machineNo.toString(),
            diff: record.diff.toString(),
            big: record.big?.toString() ?? '0',
            reg: record.reg?.toString() ?? '0',
            games: record.games?.toString() ?? '0',
        })
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditValues(null)
    }

    const handleSaveEdit = async () => {
        if (!editingId || !editValues) return

        startTransition(async () => {
            const res = await updateRecord(editingId, {
                date: new Date(editValues.date),
                machineId: editValues.machineId,
                machineNo: parseInt(editValues.machineNo),
                diff: parseInt(editValues.diff),
                big: parseInt(editValues.big),
                reg: parseInt(editValues.reg),
                games: parseInt(editValues.games),
            })

            if (res.success) {
                setEditingId(null)
                setEditValues(null)
                handleSearch()
            } else {
                alert(res.error)
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return
        startTransition(async () => {
            await deleteRecord(id)
            handleSearch()
        })
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Search Filter */}
            <div className="card-static">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">開始日</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="input-modern w-full"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">終了日</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="input-modern w-full"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">機種</label>
                            <select
                                value={machineId}
                                onChange={e => setMachineId(e.target.value)}
                                className="select-modern w-full"
                            >
                                <option value="">全て</option>
                                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">台番</label>
                            <input
                                type="number"
                                value={machineNo}
                                onChange={e => setMachineNo(e.target.value)}
                                className="input-modern w-full"
                                placeholder="台番"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isPending}
                            className="btn-primary w-full sm:w-auto px-6"
                        >
                            {isPending ? '検索中...' : '検索'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="card-static" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="overflow-x-auto">
                    <table className="table-jat w-full">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '6rem' }}>日付</th>
                                <th style={{ minWidth: '8rem' }}>機種</th>
                                <th style={{ minWidth: '4rem', textAlign: 'center' }}>台番</th>
                                <th style={{ minWidth: '4rem', textAlign: 'center' }}>BIG</th>
                                <th style={{ minWidth: '4rem', textAlign: 'center' }}>REG</th>
                                <th style={{ minWidth: '5rem', textAlign: 'right' }}>G数</th>
                                <th style={{ minWidth: '6rem', textAlign: 'right' }}>差枚</th>
                                <th style={{ minWidth: '6rem', textAlign: 'center' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => {
                                const isEditing = editingId === r.id
                                const diff = r.diff
                                const diffClass = diff > 0 ? 'text-plus' : diff < 0 ? 'text-minus' : 'text-zero'

                                if (isEditing) {
                                    return (
                                        <tr key={r.id} style={{ background: 'var(--bg-elevated)' }}>
                                            <td className="p-2">
                                                <input
                                                    type="date"
                                                    value={editValues?.date}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, date: e.target.value }))}
                                                    className="input-modern w-full p-1 text-sm"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={editValues?.machineId}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, machineId: e.target.value }))}
                                                    className="select-modern w-full p-1 text-sm"
                                                >
                                                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={editValues?.machineNo}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, machineNo: e.target.value }))}
                                                    className="input-modern w-full p-1 text-sm text-center"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={editValues?.big}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, big: e.target.value }))}
                                                    className="input-modern w-full p-1 text-sm text-center"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={editValues?.reg}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, reg: e.target.value }))}
                                                    className="input-modern w-full p-1 text-sm text-center"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={editValues?.games}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, games: e.target.value }))}
                                                    className="input-modern w-full p-1 text-sm text-right"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={editValues?.diff}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, diff: e.target.value }))}
                                                    className="input-modern w-full p-1 text-sm text-right"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 font-bold">
                                                        保存
                                                    </button>
                                                    <button onClick={handleCancelEdit} className="text-[var(--text-muted)] hover:text-white">
                                                        取消
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                }

                                return (
                                    <tr key={r.id}>
                                        <td>{new Date(r.date).toLocaleDateString()}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{r.machine.name}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                            <Link href={`/history/${r.machineId}/${r.machineNo}`} className="text-blue-400 hover:underline hover:text-blue-300 transition-colors block w-full h-full">
                                                {r.machineNo}
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{r.big ?? '-'}</td>
                                        <td style={{ textAlign: 'center' }}>{r.reg ?? '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{r.games?.toLocaleString() ?? '-'}</td>
                                        <td style={{ textAlign: 'right' }} className={diffClass}>
                                            {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex justify-center gap-3 text-sm">
                                                <button
                                                    onClick={() => handleEditClick(r)}
                                                    className="text-[var(--accent)] hover:underline"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(r.id)}
                                                    className="text-red-500 hover:underline"
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {records.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-[var(--text-muted)]">
                                        データが見つかりませんでした
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
