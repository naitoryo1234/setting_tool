'use client'

import { useState, useTransition, useEffect } from 'react'
import { getAnalysis, getMachines, toggleEventDay, AnalysisResult } from '@/lib/actions'

type Store = {
    id: string
    name: string
}

type Machine = {
    id: string
    name: string
    storeId: string
}

type Props = {
    machines: Machine[]
    stores: Store[]
}

type TabType = 'machine' | 'dow'

export default function AnalysisClient({ machines: initialMachines, stores }: Props) {
    const [storeId, setStoreId] = useState(stores[0]?.id || '')
    const [machineId, setMachineId] = useState('')
    const [machines, setMachines] = useState(initialMachines)
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

    // 店舗変更時に機種リストを更新
    useEffect(() => {
        if (storeId) {
            startTransition(async () => {
                const m = await getMachines(storeId) as any as Machine[]
                setMachines(m)
                setMachineId('')
                setResult(null)
                setHasSearched(false)
            })
        }
    }, [storeId])

    // 初期表示: 最初の店舗の機種をフィルタ
    useEffect(() => {
        if (storeId && initialMachines.length > 0) {
            const filtered = initialMachines.filter(m => m.storeId === storeId)
            setMachines(filtered)
        }
    }, [])

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
        if (!eventDate || !storeId) return
        startTransition(async () => {
            const res = await toggleEventDay(new Date(eventDate), storeId)
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
            className={`cursor-pointer select-none text-${align} hover:text-[var(--accent)] transition-colors`}
            onClick={() => handleSort(field)}
        >
            <div className={`flex items-center ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} gap-1`}>
                {label}
                <span className="text-[10px] text-[var(--text-muted)]">
                    {sortKey === field ? (sortAsc ? '▲' : '▼') : '⇅'}
                </span>
            </div>
        </th>
    )

    const PayoutBadge = ({ rate }: { rate: number }) => {
        let color = 'text-[var(--text-muted)]'
        if (rate >= 106) color = 'text-red-500'
        else if (rate >= 100) color = 'text-green-500'
        else if (rate >= 97) color = 'text-yellow-500'
        else color = 'text-blue-400'
        return <span className={`font-bold ${color}`}>{rate.toFixed(1)}%</span>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 検索条件 */}
            <div className="card-static">
                <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">店舗</label>
                        <select
                            value={storeId}
                            onChange={(e) => setStoreId(e.target.value)}
                            className="select-modern w-full"
                        >
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">機種</label>
                        <select
                            value={machineId}
                            onChange={(e) => setMachineId(e.target.value)}
                            className="select-modern w-full"
                        >
                            <option value="">選択してください</option>
                            {machines.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1 h-6">
                            <input
                                type="checkbox"
                                id="useRange"
                                checked={useRange}
                                onChange={(e) => setUseRange(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-[var(--bg-elevated)]"
                            />
                            <label htmlFor="useRange" className="text-sm cursor-pointer select-none">期間指定</label>
                        </div>
                        {useRange && (
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input-modern"
                                />
                                <span className="self-center">～</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input-modern"
                                />
                            </div>
                        )}
                    </div>

                    <div className="min-w-[140px]">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">日種別</label>
                        <select
                            value={dayFilter}
                            onChange={(e) => setDayFilter(e.target.value as any)}
                            className="select-modern w-full"
                        >
                            <option value="all">全日</option>
                            <option value="event">イベント日のみ</option>
                            <option value="normal">通常日のみ</option>
                        </select>
                    </div>

                    <div className="w-full sm:w-auto">
                        <button
                            onClick={handleSearch}
                            disabled={!machineId || isPending}
                            className="btn-primary w-full sm:w-auto px-6"
                        >
                            {isPending ? '分析中...' : '分析'}
                        </button>
                    </div>
                </div>
                {!useRange && (
                    <p className="text-xs text-[var(--text-muted)] mt-2">※ 期間未指定の場合、データが存在する全期間が対象</p>
                )}
            </div>

            {/* イベント日登録 */}
            <div className="card-static">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    📅 イベント日登録
                    <span className="text-xs text-[var(--text-muted)] font-normal">
                        ({stores.find(s => s.id === storeId)?.name || '店舗未選択'})
                    </span>
                </h3>
                <div className="flex gap-3 items-center flex-wrap">
                    <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="input-modern w-40"
                    />
                    <button
                        onClick={handleToggleEvent}
                        disabled={!eventDate || !storeId || isPending}
                        className="px-4 py-2 rounded font-bold text-sm bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50"
                    >
                        登録/解除
                    </button>
                    {eventMsg && <span className="text-sm text-green-400 animate-fade-in">{eventMsg}</span>}
                </div>
            </div>

            {/* 結果 */}
            {hasSearched && result && (
                <>
                    {/* 全体サマリー */}
                    <div className="card-static">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            📊 {result.machineName} - 全体サマリー
                            <span className="text-sm font-normal text-[var(--text-muted)]">
                                ({result.overall.days}日間分 / イベント日: {result.eventDayCount}日)
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-[var(--bg-elevated)] p-4 rounded text-center border border-[var(--border-color)]">
                                <div className="text-xs text-[var(--text-muted)] mb-1">総回転数</div>
                                <div className="text-xl font-bold">{result.overall.totalGames.toLocaleString()}</div>
                            </div>
                            <div className="bg-[var(--bg-elevated)] p-4 rounded text-center border border-[var(--border-color)]">
                                <div className="text-xs text-[var(--text-muted)] mb-1">合計差枚</div>
                                <div className={`text-xl font-bold ${result.overall.totalDiff > 0 ? 'text-plus' : 'text-minus'}`}>
                                    {result.overall.totalDiff > 0 ? '+' : ''}{result.overall.totalDiff.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-[var(--bg-elevated)] p-4 rounded text-center border border-[var(--border-color)]">
                                <div className="text-xs text-[var(--text-muted)] mb-1">BIG回数</div>
                                <div className="text-xl font-bold text-red-500">{result.overall.totalBig}</div>
                                <div className="text-xs text-[var(--text-muted)]">1/{result.overall.bigProb}</div>
                            </div>
                            <div className="bg-[var(--bg-elevated)] p-4 rounded text-center border border-[var(--border-color)]">
                                <div className="text-xs text-[var(--text-muted)] mb-1">REG回数</div>
                                <div className="text-xl font-bold text-blue-400">{result.overall.totalReg}</div>
                                <div className="text-xs text-[var(--text-muted)]">1/{result.overall.regProb}</div>
                            </div>
                            <div className="bg-[var(--bg-elevated)] p-4 rounded text-center border border-[var(--border-color)]">
                                <div className="text-xs text-[var(--text-muted)] mb-1">推定出玉率</div>
                                <div className="text-xl"><PayoutBadge rate={result.overall.payoutRate} /></div>
                            </div>
                        </div>
                        <div className="mt-4 bg-[var(--bg-elevated)] p-4 rounded text-center border border-yellow-900/30">
                            <div className="text-xs text-[var(--text-muted)] mb-1">合算確率 (BIG+REG)</div>
                            <div className="text-2xl font-bold text-yellow-500">
                                1/{result.overall.hitProb}
                            </div>
                            <div className="text-sm text-[var(--text-muted)]">
                                ({result.overall.totalHits}回 / {result.overall.totalGames.toLocaleString()}G)
                            </div>
                        </div>
                    </div>

                    {/* タブ */}
                    <div className="card-static p-0 overflow-hidden">
                        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
                            {[
                                { id: 'machine' as TabType, label: '台番別' },
                                { id: 'dow' as TabType, label: '曜日別' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id
                                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-card)]'
                                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-0">
                            {/* 台番別テーブル */}
                            {activeTab === 'machine' && (
                                <div className="overflow-x-auto">
                                    <table className="table-jat w-full">
                                        <thead>
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
                                                <tr key={r.machineNo}>
                                                    <td className="font-bold">
                                                        <a
                                                            href={`/history/${result.machineId}/${r.machineNo}`}
                                                            className="text-[var(--accent)] hover:underline"
                                                        >
                                                            {r.machineNo}
                                                        </a>
                                                    </td>
                                                    <td className="text-right">{r.days}</td>
                                                    <td className="text-right">{r.totalGames.toLocaleString()}</td>
                                                    <td className="text-right text-red-500">{r.totalBig}</td>
                                                    <td className="text-right text-blue-400">{r.totalReg}</td>
                                                    <td className="text-right">{r.totalHits}</td>
                                                    <td className="text-right text-[var(--text-muted)]">1/{r.bigProb}</td>
                                                    <td className="text-right text-[var(--text-muted)]">1/{r.regProb}</td>
                                                    <td className="text-right font-bold">1/{r.hitProb}</td>
                                                    <td className="text-right"><PayoutBadge rate={r.payoutRate} /></td>
                                                    <td className={`text-right font-bold ${r.totalDiff > 0 ? 'text-plus' : r.totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                        {r.totalDiff > 0 ? '+' : ''}{r.totalDiff.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="font-bold bg-[var(--bg-elevated)] border-t border-[var(--border-color)]">
                                                <td className="p-3">全体</td>
                                                <td className="text-right p-3">{result.overall.days}</td>
                                                <td className="text-right p-3">{result.overall.totalGames.toLocaleString()}</td>
                                                <td className="text-right p-3 text-red-500">{result.overall.totalBig}</td>
                                                <td className="text-right p-3 text-blue-400">{result.overall.totalReg}</td>
                                                <td className="text-right p-3">{result.overall.totalHits}</td>
                                                <td className="text-right p-3 text-[var(--text-muted)]">1/{result.overall.bigProb}</td>
                                                <td className="text-right p-3 text-[var(--text-muted)]">1/{result.overall.regProb}</td>
                                                <td className="text-right p-3">1/{result.overall.hitProb}</td>
                                                <td className="text-right p-3"><PayoutBadge rate={result.overall.payoutRate} /></td>
                                                <td className={`text-right p-3 ${result.overall.totalDiff > 0 ? 'text-plus' : 'text-minus'}`}>
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
                                    <table className="table-jat w-full">
                                        <thead>
                                            <tr>
                                                <th>曜日</th>
                                                <th className="text-right">日数</th>
                                                <th className="text-right">総G数</th>
                                                <th className="text-right">BIG</th>
                                                <th className="text-right">REG</th>
                                                <th className="text-right">合算</th>
                                                <th className="text-right">合算確率</th>
                                                <th className="text-right">出玉率</th>
                                                <th className="text-right">差枚</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.dowSummary.map((d) => (
                                                <tr key={d.dow}>
                                                    <td className={`font-bold ${d.dow === 0 ? 'text-red-500' : d.dow === 6 ? 'text-blue-400' : ''}`}>
                                                        {d.dowLabel}
                                                    </td>
                                                    <td className="text-right">{d.days}</td>
                                                    <td className="text-right">{d.totalGames.toLocaleString()}</td>
                                                    <td className="text-right text-red-500">{d.totalBig}</td>
                                                    <td className="text-right text-blue-400">{d.totalReg}</td>
                                                    <td className="text-right">{d.totalHits}</td>
                                                    <td className="text-right font-bold">1/{d.hitProb}</td>
                                                    <td className="text-right"><PayoutBadge rate={d.payoutRate} /></td>
                                                    <td className={`text-right font-bold ${d.totalDiff > 0 ? 'text-plus' : d.totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                        {d.totalDiff > 0 ? '+' : ''}{d.totalDiff.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {result.dowSummary.length === 0 && (
                                        <p className="text-center text-[var(--text-muted)] py-8">データがありません</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {hasSearched && !result && (
                <div className="card-static text-center text-[var(--text-muted)] py-12">
                    データが見つかりませんでした
                </div>
            )}
        </div>
    )
}
