'use client'

import { useState, useTransition } from 'react'
import { Machine } from '@prisma/client'
import { addMachineNumber, deleteMachineNumber } from '@/lib/actions'

type MachineNumber = {
    id: string
    machineNo: number
    machineId: string
    createdAt: Date
    updatedAt: Date
}

type MachineWithNumbers = Machine & { numbers: MachineNumber[] }

type Props = {
    machines: MachineWithNumbers[]
}

export default function MachinesClient({ machines }: Props) {
    const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '')
    const [newNumber, setNewNumber] = useState('')
    const [isPending, startTransition] = useTransition()

    const selectedMachine = machines.find(m => m.id === selectedMachineId)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMachineId || !newNumber) return

        startTransition(async () => {
            const res = await addMachineNumber(selectedMachineId, parseInt(newNumber))
            if (res.success) {
                setNewNumber('')
            } else {
                alert(res.error)
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('削除しますか？')) return
        startTransition(async () => {
            await deleteMachineNumber(id)
        })
    }

    return (
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {/* Machine List (Sidebar) */}
            <div className="card-static col-span-1 h-fit">
                <h2 className="font-bold mb-4 flex items-center gap-2">
                    🎰 機種一覧
                </h2>
                <ul className="space-y-1">
                    {machines.map(m => (
                        <li
                            key={m.id}
                            onClick={() => setSelectedMachineId(m.id)}
                            className={`p-3 rounded cursor-pointer transition-colors flex justify-between items-center ${selectedMachineId === m.id
                                ? 'bg-[var(--accent)] text-white font-bold shadow-md'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                                }`}
                        >
                            <span>{m.name}</span>
                            <span className={`text-xs ${selectedMachineId === m.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                {m.numbers.length}台
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Number Management (Main) */}
            <div className="card-static col-span-1 md:col-span-2">
                {selectedMachine ? (
                    <>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span>{selectedMachine.name}</span>
                            <span className="text-sm font-normal text-[var(--text-muted)]">台番管理</span>
                        </h2>

                        <div className="bg-[var(--bg-elevated)] p-4 rounded mb-8 border border-[var(--border-color)]">
                            <h3 className="text-xs font-bold text-[var(--text-muted)] mb-3">新規登録</h3>
                            <form onSubmit={handleAdd} className="flex gap-4">
                                <input
                                    type="number"
                                    value={newNumber}
                                    onChange={e => setNewNumber(e.target.value)}
                                    placeholder="台番号 (例: 100)"
                                    className="input-modern flex-1"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2 rounded font-bold text-white bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? '追加中...' : '追加'}
                                </button>
                            </form>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-[var(--text-muted)] mb-3">登録済み台番号 ({selectedMachine.numbers.length}件)</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {selectedMachine.numbers.map(n => (
                                    <div key={n.id} className="relative group bg-[var(--bg-elevated)] border border-[var(--border-color)] p-3 rounded text-center hover:border-[var(--accent)] transition-colors">
                                        <span className="font-bold text-lg text-[var(--text-primary)]">{n.machineNo}</span>
                                        <button
                                            onClick={() => handleDelete(n.id)}
                                            disabled={isPending}
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                            title="削除"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {selectedMachine.numbers.length === 0 && (
                                    <div className="col-span-full text-[var(--text-muted)] text-center py-12 border-2 border-dashed border-[var(--border-color)] rounded">
                                        登録された台番はありません
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-[var(--text-muted)] text-center py-20">
                        ← 左側のリストから機種を選択してください
                    </div>
                )}
            </div>
        </div>
    )
}
