'use client'

import { useState, useTransition } from 'react'
import { Machine, MachineNumber } from '@prisma/client'
import { addMachineNumber, deleteMachineNumber } from '@/lib/actions'

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
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Machine List (Sidebar) */}
            <div className="bg-white p-4 rounded shadow col-span-1">
                <h2 className="font-bold mb-4">機種一覧</h2>
                <ul className="space-y-2">
                    {machines.map(m => (
                        <li
                            key={m.id}
                            onClick={() => setSelectedMachineId(m.id)}
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedMachineId === m.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                        >
                            {m.name} <span className="text-gray-500 text-sm">({m.numbers.length}台)</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Number Management (Main) */}
            <div className="bg-white p-6 rounded shadow col-span-2">
                {selectedMachine ? (
                    <>
                        <h2 className="text-xl font-bold mb-6">{selectedMachine.name} 台番管理</h2>

                        <form onSubmit={handleAdd} className="flex gap-4 mb-8">
                            <input
                                type="number"
                                value={newNumber}
                                onChange={e => setNewNumber(e.target.value)}
                                placeholder="台番号を追加 (例: 100)"
                                className="flex-1 border p-2 rounded"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isPending}
                                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {isPending ? '追加中...' : '追加'}
                            </button>
                        </form>

                        <div className="grid grid-cols-4 gap-4">
                            {selectedMachine.numbers.map(n => (
                                <div key={n.id} className="relative group border p-3 rounded text-center hover:bg-gray-50">
                                    <span className="font-bold text-lg">{n.machineNo}</span>
                                    <button
                                        onClick={() => handleDelete(n.id)}
                                        disabled={isPending}
                                        className="absolute top-1 right-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="削除"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {selectedMachine.numbers.length === 0 && (
                                <div className="col-span-4 text-gray-500 text-center py-8">
                                    登録された台番はありません
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500 text-center py-12">
                        機種を選択してください
                    </div>
                )}
            </div>
        </div>
    )
}
