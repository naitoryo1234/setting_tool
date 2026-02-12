'use client'

import { useState, useTransition } from 'react'
import { getAnalysis, toggleEventDay, AnalysisResult, DowSummary } from '@/lib/actions'

type Machine = {
    id: string
    name: string
}

type Props = {
    machines: Machine[]
}

type TabType = 'machine' | 'dow' | 'event'

export default function AnalysisClient({ machines }: Props) {
    const [machineId, setMachineId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [useRange, setUseRange] = useState(false)
    const [dayFilter, setDayFilter] = useState<'all' | 'event' | 'normal'>('all')
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [isPending, startTransition] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>('machine')
    const [sortKey, setSortKey] = useState<string>('machineNo')
    const [sortAsc, setSortAsc] = useState(true)

    // イベント日登録用
    const [eventDate, setEventDate] = useState('')
    const [eventMsg, setEventMsg] = useState('')

    const handleSearch = () => {
        if (!machineId) return
        startTransition(async () => {
            const start = useRange && startDate ? new Date(startDate) : undefined
            const end = useRange && endDate ? new Date(endDate) : undefined
            const data = await getAnalysis(machineId, start, end, dayFilter)
            setResult(data)
            setHasSearched(true)
        })
    }

    const handleToggleEvent = () => {
        if (!eventDate) return
        startTransition(async () => {
            const res = await toggleEventDay(new Date(eventDate))
            setEventMsg(res.added ? `${eventDate} をイベント日に登録しました` : `${eventDate} のイベント登録を解除しました`)
            // 結果があれば再検索
            if (machineId && hasSearched) {
                const start = useRange && startDate ? new Date(startDate) : undefined
                const end = useRange && endDate ? new Date(endDate) : undefined
                const data = await getAnalysis(machineId, start, end, dayFilter)
                setResult(data)
            }
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

    const PayoutBadge = ({ rate }: { rate: number }) => {
        let color = 'text-gray-600'
        if (rate >= 106) color = 'text-red-600'
        else if (rate >= 100) color = 'text-green-600'
        else if (rate >= 97) color = 'text-yellow-600'
        else color = 'text-blue-600'
        return <span className={`font-bold ${color}`}>{rate.toFixed(1)}%</span>
    }

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
                    <div>
                        <label className="block text-sm font-medium mb-1">日種別</label>
                        <select
                            value={dayFilter}
                            onChange={(e) => setDayFilter(e.target.value as any)}
                            className="border p-2 rounded"
                        >
                            <option value="all">全日</option>
                            <option value="event">イベント日のみ</option>
                            <option value="normal">通常日のみ</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={!machineId || isPending}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isPending ? '分析中...' : '分析'}
                    </button>
                </div>
                {!useRange && (
                    <p className="text-sm text-gray-500">※ 期間未指定の場合、BIG/REG/G数データが存在する全期間が対象</p>
                )}
            </div>

            {/* イベント日登録 */}
            <div className="bg-white p-4 rounded shadow">
                <h3 className="text-sm font-bold mb-2">イベント日登録</h3>
                <div className="flex gap-3 items-center flex-wrap">
                    <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="border p-2 rounded text-sm"
                    />
                    <button
                        onClick={handleToggleEvent}
                        disabled={!eventDate || isPending}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                        登録/解除
                    </button>
                    {eventMsg && <span className="text-sm text-green-700">{eventMsg}</span>}
                </div>
            </div>

            {/* 結果 */}
            {hasSearched && result && (
                <>
                    {/* 全体サマリー */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-lg font-bold mb-4">
                            {result.machineName} - 全体サマリー
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({result.overall.days}日間分 / イベント日: {result.eventDayCount}日)
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                            <div className="bg-purple-50 p-4 rounded text-center">
                                <div className="text-xs text-gray-500">推定出玉率</div>
                                <div className="text-xl"><PayoutBadge rate={result.overall.payoutRate} /></div>
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

                    {/* タブ */}
                    <div className="bg-white rounded shadow">
                        <div className="flex border-b">
                            {[
                                { id: 'machine' as TabType, label: '台番別' },
                                { id: 'dow' as TabType, label: '曜日別' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {/* 台番別テーブル */}
                            {activeTab === 'machine' && (
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
                                                <SortHeader label="出玉率" field="payoutRate" />
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
                                                    <td className="px-3 py-3 text-right"><PayoutBadge rate={r.payoutRate} /></td>
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
                                                <td className="px-3 py-3 text-right"><PayoutBadge rate={result.overall.payoutRate} /></td>
                                                <td className={`px-3 py-3 text-right ${result.overall.totalDiff > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                    {result.overall.totalDiff > 0 ? '+' : ''}{result.overall.totalDiff.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            {/* 曜日別テーブル */}
                            {activeTab === 'dow' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-3 py-3">曜日</th>
                                                <th className="px-3 py-3 text-right">日数</th>
                                                <th className="px-3 py-3 text-right">総G数</th>
                                                <th className="px-3 py-3 text-right">BIG</th>
                                                <th className="px-3 py-3 text-right">REG</th>
                                                <th className="px-3 py-3 text-right">合算</th>
                                                <th className="px-3 py-3 text-right">合算確率</th>
                                                <th className="px-3 py-3 text-right">出玉率</th>
                                                <th className="px-3 py-3 text-right">差枚</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.dowSummary.map((d) => (
                                                <tr key={d.dow} className={`border-b hover:bg-gray-50 ${d.dow === 0 ? 'bg-red-50/50' : d.dow === 6 ? 'bg-blue-50/50' : ''}`}>
                                                    <td className={`px-3 py-3 font-medium ${d.dow === 0 ? 'text-red-600' : d.dow === 6 ? 'text-blue-600' : ''}`}>
                                                        {d.dowLabel}
                                                    </td>
                                                    <td className="px-3 py-3 text-right">{d.days}</td>
                                                    <td className="px-3 py-3 text-right">{d.totalGames.toLocaleString()}</td>
                                                    <td className="px-3 py-3 text-right text-red-600 font-medium">{d.totalBig}</td>
                                                    <td className="px-3 py-3 text-right text-blue-600 font-medium">{d.totalReg}</td>
                                                    <td className="px-3 py-3 text-right font-medium">{d.totalHits}</td>
                                                    <td className="px-3 py-3 text-right font-bold">1/{d.hitProb}</td>
                                                    <td className="px-3 py-3 text-right"><PayoutBadge rate={d.payoutRate} /></td>
                                                    <td className={`px-3 py-3 text-right font-bold ${d.totalDiff > 0 ? 'text-red-500' : d.totalDiff < 0 ? 'text-blue-500' : ''}`}>
                                                        {d.totalDiff > 0 ? '+' : ''}{d.totalDiff.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {result.dowSummary.length === 0 && (
                                        <p className="text-center text-gray-400 py-8">データがありません</p>
                                    )}
                                </div>
                            )}
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
