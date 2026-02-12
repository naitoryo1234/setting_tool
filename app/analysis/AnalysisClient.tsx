'use client'

import { useState, useTransition } from 'react'
import { getAnalysis, AnalysisResult } from '@/lib/actions'

type Machine = {
    id: string
    name: string
}

type Props = {
    machines: Machine[]
}

export default function AnalysisClient({ machines }: Props) {
    const [machineId, setMachineId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [useRange, setUseRange] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [isPending, startTransition] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)
    const [sortKey, setSortKey] = useState<string>('machineNo')
    const [sortAsc, setSortAsc] = useState(true)

    const handleSearch = () => {
        if (!machineId) return
        startTransition(async () => {
            const start = useRange && startDate ? new Date(startDate) : undefined
            const end = useRange && endDate ? new Date(endDate) : undefined
            const data = await getAnalysis(machineId, start, end)
            setResult(data)
            setHasSearched(true)
        })
    }

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc)
        } else {
            setSortKey(key)
            setSortAsc(key === 'machineNo')
        }
    }

    const sortedRecords = result?.records
        ? [...result.records].sort((a, b) => {
            const va = (a as any)[sortKey] ?? 0
            const vb = (b as any)[sortKey] ?? 0
            return sortAsc ? va - vb : vb - va
        })
        : []

    const SortHeader = ({ label, field, align = 'right' }: { label: string; field: string; align?: string }) => (
        <th
            className={`px-3 py-3 cursor-pointer hover:bg-gray-200 select-none text-${align}`}
            onClick={() => handleSort(field)}
        >
            {label}
            {sortKey === field && (sortAsc ? ' ▲' : ' ▼')}
        </th>
    )

    return (
        <div className="space-y-6">
            {/* 検索条件 */}
            <div className="bg-white p-6 rounded shadow space-y-4">
                <div className="flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-sm font-medium mb-1">機種</label>
                        <select
                            value={machineId}
                            onChange={(e) => setMachineId(e.target.value)}
                            className="border p-2 rounded min-w-[200px]"
                        >
                            <option value="">選択してください</option>
                            {machines.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="useRange"
                            checked={useRange}
                            onChange={(e) => setUseRange(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="useRange" className="text-sm">期間指定</label>
                    </div>
                    {useRange && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">開始日</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">終了日</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border p-2 rounded"
                                />
                            </div>
                        </>
                    )}
                    <button
                        onClick={handleSearch}
                        disabled={!machineId || isPending}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isPending ? '分析中...' : '分析'}
                    </button>
                </div>
                {!useRange && (
                    <p className="text-sm text-gray-500">※ 期間未指定の場合、BIG/REG/G数データが存在する全期間が対象になります</p>
                )}
            </div>

            {/* 結果 */}
            {hasSearched && result && (
                <>
                    {/* 全体サマリー */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-lg font-bold mb-4">
                            {result.machineName} - 全体サマリー
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({result.overall.days}日間分)
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded text-center">
                                <div className="text-xs text-gray-500">総回転数</div>
                                <div className="text-xl font-bold">{result.overall.totalGames.toLocaleString()}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded text-center">
                                <div className="text-xs text-gray-500">合計差枚</div>
                                <div className={`text-xl font-bold ${result.overall.totalDiff > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                    {result.overall.totalDiff > 0 ? '+' : ''}{result.overall.totalDiff.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded text-center">
                                <div className="text-xs text-gray-500">BIG回数</div>
                                <div className="text-xl font-bold text-red-600">{result.overall.totalBig}</div>
                                <div className="text-sm text-gray-600">1/{result.overall.bigProb}</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded text-center">
                                <div className="text-xs text-gray-500">REG回数</div>
                                <div className="text-xl font-bold text-blue-600">{result.overall.totalReg}</div>
                                <div className="text-sm text-gray-600">1/{result.overall.regProb}</div>
                            </div>
                        </div>
                        <div className="mt-4 bg-yellow-50 p-4 rounded text-center">
                            <div className="text-xs text-gray-500">合算確率 (BIG+REG)</div>
                            <div className="text-2xl font-bold text-yellow-700">
                                1/{result.overall.hitProb}
                            </div>
                            <div className="text-sm text-gray-500">
                                ({result.overall.totalHits}回 / {result.overall.totalGames.toLocaleString()}G)
                            </div>
                        </div>
                    </div>

                    {/* 台番別テーブル */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-lg font-bold mb-4">台番別分析</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <SortHeader label="台番" field="machineNo" align="left" />
                                        <SortHeader label="日数" field="days" />
                                        <SortHeader label="総G数" field="totalGames" />
                                        <SortHeader label="BIG" field="totalBig" />
                                        <SortHeader label="REG" field="totalReg" />
                                        <SortHeader label="合算" field="totalHits" />
                                        <SortHeader label="BIG確率" field="bigProb" />
                                        <SortHeader label="REG確率" field="regProb" />
                                        <SortHeader label="合算確率" field="hitProb" />
                                        <SortHeader label="差枚" field="totalDiff" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRecords.map((r) => (
                                        <tr key={r.machineNo} className="border-b hover:bg-gray-50">
                                            <td className="px-3 py-3 font-medium">
                                                <a
                                                    href={`/history/${result.machineId}/${r.machineNo}`}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {r.machineNo}
                                                </a>
                                            </td>
                                            <td className="px-3 py-3 text-right">{r.days}</td>
                                            <td className="px-3 py-3 text-right">{r.totalGames.toLocaleString()}</td>
                                            <td className="px-3 py-3 text-right text-red-600 font-medium">{r.totalBig}</td>
                                            <td className="px-3 py-3 text-right text-blue-600 font-medium">{r.totalReg}</td>
                                            <td className="px-3 py-3 text-right font-medium">{r.totalHits}</td>
                                            <td className="px-3 py-3 text-right">1/{r.bigProb}</td>
                                            <td className="px-3 py-3 text-right">1/{r.regProb}</td>
                                            <td className="px-3 py-3 text-right font-bold">1/{r.hitProb}</td>
                                            <td className={`px-3 py-3 text-right font-bold ${r.totalDiff > 0 ? 'text-red-500' : r.totalDiff < 0 ? 'text-blue-500' : ''}`}>
                                                {r.totalDiff > 0 ? '+' : ''}{r.totalDiff.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold border-t-2">
                                        <td className="px-3 py-3">全体</td>
                                        <td className="px-3 py-3 text-right">{result.overall.days}</td>
                                        <td className="px-3 py-3 text-right">{result.overall.totalGames.toLocaleString()}</td>
                                        <td className="px-3 py-3 text-right text-red-600">{result.overall.totalBig}</td>
                                        <td className="px-3 py-3 text-right text-blue-600">{result.overall.totalReg}</td>
                                        <td className="px-3 py-3 text-right">{result.overall.totalHits}</td>
                                        <td className="px-3 py-3 text-right">1/{result.overall.bigProb}</td>
                                        <td className="px-3 py-3 text-right">1/{result.overall.regProb}</td>
                                        <td className="px-3 py-3 text-right">1/{result.overall.hitProb}</td>
                                        <td className={`px-3 py-3 text-right ${result.overall.totalDiff > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {result.overall.totalDiff > 0 ? '+' : ''}{result.overall.totalDiff.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {hasSearched && !result && (
                <div className="bg-white p-8 rounded shadow text-center text-gray-400">
                    データが見つかりませんでした
                </div>
            )}
        </div>
    )
}
