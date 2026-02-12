import { getMachineNoHistory } from '@/lib/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ machineId: string; machineNo: string }>
}

export default async function HistoryPage({ params }: Props) {
    const { machineId, machineNo: machineNoStr } = await params
    const machineNo = parseInt(machineNoStr)
    const { machineName, records } = await getMachineNoHistory(machineId, machineNo)

    // 合計差枚
    const totalDiff = records.reduce((sum, r) => sum + r.diff, 0)

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/summary" className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm font-bold no-underline">
                    ← 集計に戻る
                </Link>
                <h1 className="text-2xl font-bold">
                    {machineName} - No.{machineNo} 履歴
                </h1>
            </div>

            {/* サマリーカード */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card-static text-center">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">データ件数</div>
                    <div className="text-2xl font-bold">{records.length}</div>
                </div>
                <div className="card-static text-center">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">合計差枚</div>
                    <div className={`text-2xl font-bold ${totalDiff > 0 ? 'text-plus' : totalDiff < 0 ? 'text-minus' : ''}`}>
                        {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}
                    </div>
                </div>
                <div className="card-static text-center">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">平均差枚</div>
                    <div className={`text-2xl font-bold ${totalDiff > 0 ? 'text-plus' : totalDiff < 0 ? 'text-minus' : ''}`}>
                        {records.length > 0 ? Math.round(totalDiff / records.length).toLocaleString() : 0}
                    </div>
                </div>
            </div>

            {/* 履歴テーブル */}
            <div className="card-static p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table-jat w-full text-sm text-left">
                        <thead>
                            <tr>
                                <th className="px-4 py-3">日付</th>
                                <th className="px-4 py-3 text-right">差枚</th>
                                <th className="px-4 py-3 text-right">BIG</th>
                                <th className="px-4 py-3 text-right">REG</th>
                                <th className="px-4 py-3 text-right">G数</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => {
                                const dateStr = new Date(r.date).toLocaleDateString('ja-JP', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                })
                                return (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">{dateStr}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${r.diff > 0 ? 'text-plus' : r.diff < 0 ? 'text-minus' : 'text-zero'}`}>
                                            {r.diff > 0 ? '+' : ''}{r.diff.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-500">{r.big ?? '-'}</td>
                                        <td className="px-4 py-3 text-right text-blue-400">{r.reg ?? '-'}</td>
                                        <td className="px-4 py-3 text-right">{r.games?.toLocaleString() ?? '-'}</td>
                                    </tr>
                                )
                            })}
                            {records.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-[var(--text-muted)]">
                                        データがありません
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
