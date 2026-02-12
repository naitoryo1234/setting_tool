'use client'

import { useState, useTransition, useEffect } from 'react'
import { searchRecords, updateRecord, deleteRecord } from '@/lib/actions'
import { Machine, Record } from '@prisma/client'

type Props = {
    machines: Machine[]
}

type RecordWithMachine = Record & { machine: Machine }

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

    // Initial load (e.g. last 30 days?)
    useEffect(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 7) // Default last 7 days
        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end.toISOString().split('T')[0])
        // Auto search?
        // startTransition(async () => ...) // Better trigger manually or on mount
    }, [])

    const handleEditClick = (record: RecordWithMachine) => {
        setEditingId(record.id)
        setEditValues({
            date: new Date(record.date).toISOString().split('T')[0],
            machineId: record.machineId,
            machineNo: record.machineNo.toString(),
            diff: record.diff.toString(),
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
            })

            if (res.success) {
                setEditingId(null)
                setEditValues(null)
                // Refresh current list
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
        <div className="space-y-6">
            {/* Search Filter */}
            <div className="bg-white p-6 rounded shadow space-y-4">
                <h2 className="font-bold">検索フィルタ</h2>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">開始日</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">終了日</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">機種</label>
                        <select value={machineId} onChange={e => setMachineId(e.target.value)} className="border p-2 rounded w-40">
                            <option value="">全て</option>
                            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">台番</label>
                        <input type="number" value={machineNo} onChange={e => setMachineNo(e.target.value)} className="border p-2 rounded w-24" placeholder="台番" />
                    </div>
                    <button onClick={handleSearch} disabled={isPending} className="bg-blue-600 text-white px-4 py-2 rounded">
                        {isPending ? '検索中...' : '検索'}
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white p-6 rounded shadow overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 uppercase">
                        <tr>
                            <th className="px-4 py-3">日付</th>
                            <th className="px-4 py-3">機種</th>
                            <th className="px-4 py-3">台番</th>
                            <th className="px-4 py-3 text-right">差枚</th>
                            <th className="px-4 py-3 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(r => {
                            const isEditing = editingId === r.id
                            return (
                                <tr key={r.id} className="border-b hover:bg-gray-50">
                                    {isEditing ? (
                                        <>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="date"
                                                    value={editValues?.date}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, date: e.target.value }))}
                                                    className="border p-1 w-full"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={editValues?.machineId}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, machineId: e.target.value }))}
                                                    className="border p-1 w-full"
                                                >
                                                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    value={editValues?.machineNo}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, machineNo: e.target.value }))}
                                                    className="border p-1 w-20"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    value={editValues?.diff}
                                                    onChange={e => setEditValues(prev => ({ ...prev!, diff: e.target.value }))}
                                                    className="border p-1 w-24 text-right"
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-center space-x-2">
                                                <button onClick={handleSaveEdit} className="text-green-600 font-bold">保存</button>
                                                <button onClick={handleCancelEdit} className="text-gray-500">取消</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-3">{new Date(r.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">{r.machine.name}</td>
                                            <td className="px-4 py-3">{r.machineNo}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${r.diff > 0 ? 'text-red-500' : r.diff < 0 ? 'text-blue-500' : ''}`}>
                                                {r.diff}
                                            </td>
                                            <td className="px-4 py-3 text-center space-x-2">
                                                <button onClick={() => handleEditClick(r)} className="text-blue-600 hover:underline">編集</button>
                                                <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">削除</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            )
                        })}
                        {records.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">データがありません（検索してください）</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
