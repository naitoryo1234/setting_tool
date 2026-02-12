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
                <Link href="/summary" className="text-blue-600 hover:underline text-sm">
                    ← 集計に戻る
                </Link>
                <h1 className="text-2xl font-bold">
                    {machineName} - No.{machineNo} 履歴
                </h1>
            </div>

            {/* サマリーカード */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow text-center">
                    <div className="text-sm text-gray-500">データ件数</div>
                    <div className="text-2xl font-bold">{records.length}</div>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <div className="text-sm text-gray-500">合計差枚</div>
                    <div className={`text-2xl font-bold ${totalDiff > 0 ? 'text-red-500' : totalDiff < 0 ? 'text-blue-500' : ''}`}>
                        {totalDiff > 0 ? '+' : ''}{totalDiff}
                    </div>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <div className="text-sm text-gray-500">平均差枚</div>
                    <div className={`text-2xl font-bold ${totalDiff > 0 ? 'text-red-500' : totalDiff < 0 ? 'text-blue-500' : ''}`}>
                        {records.length > 0 ? Math.round(totalDiff / records.length) : 0}
                    </div>
                </div>
            </div>

            {/* 履歴テーブル */}
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3">日付</th>
                            <th className="px-4 py-3 text-right">差枚</th>
                            <th className="px-4 py-3 text-right">BIG</th>
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
                                <tr key={r.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">{dateStr}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${r.diff > 0 ? 'text-red-500' : r.diff < 0 ? 'text-blue-500' : ''}`}>
                                        {r.diff > 0 ? '+' : ''}{r.diff}
                                    </td>
                                    <td className="px-4 py-3 text-right">{r.big ?? '-'}</td>
                                    <td className="px-4 py-3 text-right">{r.games ?? '-'}</td>
                                </tr>
                            )
                        })}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                    データがありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
