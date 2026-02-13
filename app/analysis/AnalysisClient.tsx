'use client'

import { useState, useTransition, useEffect } from 'react'
import { getAnalysis, getMachines, toggleEventDay, AnalysisResult } from '@/lib/actions'
import { Microscope, Search, Calendar, CalendarCheck2, TrendingUp, AlertCircle, BarChart2, Hash, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, RotateCw, Sparkles, Coins, Inbox } from 'lucide-react'

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
            className={`cursor-pointer select-none hover:text-[var(--accent)] transition-colors group`}
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

    const PayoutBadge = ({ rate }: { rate: number }) => {
        let color = 'var(--text-muted)'
        let className = 'tabular-nums font-bold'
        if (rate >= 106) { color = '#f43f5e'; className += ' text-rose-500 ai-pulse-bad px-2 py-0.5 rounded' }
        else if (rate >= 100) { color = '#4ade80'; className += ' text-emerald-400 ai-pulse-good px-2 py-0.5 rounded' }
        else if (rate >= 97) { color = '#fbbf24' }
        else { color = '#38bdf8' }
        return <span className={className} style={{ color }}>{rate.toFixed(1)}%</span>
    }

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
            {/* ページヘッダー */}
            <div className="page-header border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Microscope size={24} />
                    </div>
                    <div>
                        <h1 className="page-header-title text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">深掘り分析</h1>
                        <p className="page-header-subtitle text-sm text-[var(--text-muted)]">台番・曜日・イベント日別の傾向を探る</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* 検索条件 */}
                <div className="card-static stagger-item p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">店舗</label>
                            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="select-modern w-full">
                                {stores.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">機種</label>
                            <select value={machineId} onChange={(e) => setMachineId(e.target.value)} className="select-modern w-full">
                                <option value="">選択してください</option>
                                {machines.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1 h-6">
                                <input type="checkbox" id="useRange" checked={useRange} onChange={(e) => setUseRange(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500"
                                />
                                <label htmlFor="useRange" className="text-sm cursor-pointer select-none font-medium text-[var(--text-secondary)]">期間指定</label>
                            </div>
                            {useRange && (
                                <div className="flex gap-2 items-center">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-modern tabular-nums text-xs py-1.5" />
                                    <span className="text-[var(--text-muted)]">～</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-modern tabular-nums text-xs py-1.5" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-[140px]">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">日種別</label>
                            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value as any)} className="select-modern w-full">
                                <option value="all">全日</option>
                                <option value="event">イベント日のみ</option>
                                <option value="normal">通常日のみ</option>
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <button onClick={handleSearch} disabled={!machineId || isPending} className="btn-primary w-full sm:w-auto px-6 flex items-center justify-center gap-2">
                                {isPending ? <span className="animate-spin">⏳</span> : <Search size={16} />}
                                <span>{isPending ? '分析中...' : '分析実行'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* イベント日登録 */}
                <div className="card-static stagger-item p-4 border border-white/5 bg-slate-900/30">
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-wider">
                        <CalendarCheck2 size={14} className="text-[var(--accent)]" />
                        イベント日登録
                        <span className="text-[10px] font-normal text-[var(--text-muted)] NormalCase tracking-normal">
                            ({stores.find(s => s.id === storeId)?.name || '店舗未選択'})
                        </span>
                    </h3>
                    <div className="flex gap-3 items-center flex-wrap">
                        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-modern w-36 tabular-nums text-xs" />
                        <button
                            onClick={handleToggleEvent}
                            disabled={!eventDate || !storeId || isPending}
                            className="btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-500/20"
                        >
                            登録 / 解除
                        </button>
                        {eventMsg && <span className="text-xs animate-success text-emerald-400 flex items-center gap-1"><AlertCircle size={12} /> {eventMsg}</span>}
                    </div>
                </div>

                {/* スケルトンローディング */}
                {isPending && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="card-static p-6">
                                    <div className="skeleton h-3 w-1/2 mb-3" />
                                    <div className="skeleton h-8 w-3/4" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 結果 */}
                {hasSearched && !isPending && result && (
                    <>
                        {/* 全体サマリー */}
                        <div className="card-static stagger-item border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                <BarChart2 size={20} className="text-indigo-400" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                                    {result.machineName}
                                </span>
                                <span className="text-xs font-normal text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-full tabular-nums">
                                    Total: {result.overall.days}days (Events: {result.eventDayCount})
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: '総回転数', value: result.overall.totalGames.toLocaleString(), color: 'var(--text-primary)', icon: <RotateCw size={14} className="opacity-50" /> },
                                    { label: '合計差枚', value: `${result.overall.totalDiff > 0 ? '+' : ''}${result.overall.totalDiff.toLocaleString()}`, color: result.overall.totalDiff > 0 ? 'var(--color-plus)' : 'var(--color-minus)', icon: <Coins size={14} className="opacity-50" /> },
                                    { label: 'BIG回数', value: result.overall.totalBig.toString(), sub: `1/${result.overall.bigProb}`, color: '#f43f5e', icon: <ArrowUp size={14} className="opacity-50" /> },
                                    { label: 'REG回数', value: result.overall.totalReg.toString(), sub: `1/${result.overall.regProb}`, color: '#38bdf8', icon: <ArrowDown size={14} className="opacity-50" /> },
                                    { label: '推定出玉率', value: `${result.overall.payoutRate.toFixed(1)}%`, color: result.overall.payoutRate >= 100 ? '#4ade80' : '#fbbf24', icon: <TrendingUp size={14} className="opacity-50" />, isRate: true },
                                ].map((stat, i) => (
                                    <div key={i} className={`card p-4 text-center relative overflow-hidden group border border-white/5 bg-slate-900/50 ${(stat as any).isRate && parseFloat(stat.value) >= 106 ? 'ai-pulse-bad' : (stat as any).isRate && parseFloat(stat.value) >= 100 ? 'ai-pulse-good' : ''}`}>
                                        <div className="text-[10px] text-[var(--text-muted)] mb-2 uppercase tracking-wider flex justify-center items-center gap-1">
                                            {(stat as any).icon} {stat.label}
                                        </div>
                                        <div className="stat-value glow-value text-xl md:text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
                                        {(stat as any).sub && <div className="text-[10px] text-[var(--text-muted)] mt-1 tabular-nums">{(stat as any).sub}</div>}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-center flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 text-yellow-500/10"><Sparkles size={48} /></div>
                                <div className="text-[10px] text-yellow-500/70 mb-1 uppercase tracking-wider font-semibold">Combined Probability (BIG+REG)</div>
                                <div className="stat-value glow-value text-3xl font-black text-yellow-400 tabular-nums z-10">
                                    1/{result.overall.hitProb}
                                </div>
                                <div className="text-xs text-[var(--text-muted)] mt-1 tabular-nums z-10">
                                    ({result.overall.totalHits} hits / {result.overall.totalGames.toLocaleString()}G)
                                </div>
                            </div>
                        </div>

                        {/* タブ */}
                        <div className="card-static stagger-item p-0 overflow-hidden border border-white/5">
                            <div className="flex border-b border-white/5 bg-slate-900/50">
                                {[
                                    { id: 'machine' as TabType, label: '台番別解析', icon: <Hash size={14} /> },
                                    { id: 'dow' as TabType, label: '曜日別解析', icon: <CalendarDays size={14} /> },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'}`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                                    </button>
                                ))}
                            </div>

                            <div>
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
                                                    <tr key={r.machineNo} className="group hover:bg-white/5 transition-colors">
                                                        <td className="pl-4 py-3 font-bold tabular-nums">
                                                            <a href={`/history/${result.machineId}/${r.machineNo}`} className="text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 decoration-indigo-500/30">
                                                                {r.machineNo}
                                                            </a>
                                                        </td>
                                                        <td className="text-right py-3 tabular-nums">{r.days}</td>
                                                        <td className="text-right py-3 tabular-nums text-[var(--text-secondary)]">{r.totalGames.toLocaleString()}</td>
                                                        <td className="text-right py-3 tabular-nums text-rose-400">{r.totalBig}</td>
                                                        <td className="text-right py-3 tabular-nums text-sky-400">{r.totalReg}</td>
                                                        <td className="text-right py-3 tabular-nums">{r.totalHits}</td>
                                                        <td className="text-right py-3 tabular-nums text-[var(--text-muted)]">1/{r.bigProb}</td>
                                                        <td className="text-right py-3 tabular-nums text-[var(--text-muted)]">1/{r.regProb}</td>
                                                        <td className="text-right py-3 tabular-nums font-medium">1/{r.hitProb}</td>
                                                        <td className="text-right py-3"><PayoutBadge rate={r.payoutRate} /></td>
                                                        <td className="text-right py-3 pr-4 tabular-nums font-bold">
                                                            <span className={r.totalDiff > 0 ? 'text-plus' : r.totalDiff < 0 ? 'text-minus' : 'text-zero'}>
                                                                {r.totalDiff > 0 ? '+' : ''}{r.totalDiff.toLocaleString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-900/80 font-bold border-t border-white/10">
                                                    <td className="pl-4 py-4">全体</td>
                                                    <td className="text-right py-4 tabular-nums">{result.overall.days}</td>
                                                    <td className="text-right py-4 tabular-nums">{result.overall.totalGames.toLocaleString()}</td>
                                                    <td className="text-right py-4 tabular-nums text-rose-400">{result.overall.totalBig}</td>
                                                    <td className="text-right py-4 tabular-nums text-sky-400">{result.overall.totalReg}</td>
                                                    <td className="text-right py-4 tabular-nums">{result.overall.totalHits}</td>
                                                    <td className="text-right py-4 tabular-nums text-[var(--text-muted)]">1/{result.overall.bigProb}</td>
                                                    <td className="text-right py-4 tabular-nums text-[var(--text-muted)]">1/{result.overall.regProb}</td>
                                                    <td className="text-right py-4 tabular-nums">1/{result.overall.hitProb}</td>
                                                    <td className="text-right py-4"><PayoutBadge rate={result.overall.payoutRate} /></td>
                                                    <td className="text-right py-4 pr-4 tabular-nums">
                                                        <span className={result.overall.totalDiff > 0 ? 'text-plus' : 'text-minus'}>
                                                            {result.overall.totalDiff > 0 ? '+' : ''}{result.overall.totalDiff.toLocaleString()}
                                                        </span>
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
                                                    <th className="pl-4">曜日</th>
                                                    <th className="text-right">日数</th>
                                                    <th className="text-right">総G数</th>
                                                    <th className="text-right">BIG</th>
                                                    <th className="text-right">REG</th>
                                                    <th className="text-right">合算</th>
                                                    <th className="text-right">合算確率</th>
                                                    <th className="text-right">出玉率</th>
                                                    <th className="text-right pr-4">差枚</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.dowSummary.map((d) => (
                                                    <tr key={d.dow} className="group hover:bg-white/5 transition-colors">
                                                        <td className="pl-4 py-3 font-bold" style={{ color: d.dow === 0 ? '#f43f5e' : d.dow === 6 ? '#38bdf8' : 'var(--text-primary)' }}>
                                                            {d.dowLabel}
                                                        </td>
                                                        <td className="text-right py-3 tabular-nums">{d.days}</td>
                                                        <td className="text-right py-3 tabular-nums text-[var(--text-secondary)]">{d.totalGames.toLocaleString()}</td>
                                                        <td className="text-right py-3 tabular-nums text-rose-400">{d.totalBig}</td>
                                                        <td className="text-right py-3 tabular-nums text-sky-400">{d.totalReg}</td>
                                                        <td className="text-right py-3 tabular-nums">{d.totalHits}</td>
                                                        <td className="text-right py-3 tabular-nums font-medium">1/{d.hitProb}</td>
                                                        <td className="text-right py-3"><PayoutBadge rate={d.payoutRate} /></td>
                                                        <td className="text-right py-3 pr-4 tabular-nums font-bold">
                                                            <span className={d.totalDiff > 0 ? 'text-plus' : d.totalDiff < 0 ? 'text-minus' : 'text-zero'}>
                                                                {d.totalDiff > 0 ? '+' : ''}{d.totalDiff.toLocaleString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {result.dowSummary.length === 0 && (
                                            <div className="py-16 text-center text-[var(--text-muted)]">
                                                <Inbox size={48} className="mx-auto mb-3 opacity-20" />
                                                データがありません
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {hasSearched && !isPending && !result && (
                    <div className="card-static text-center py-16">
                        <Search size={48} className="mx-auto mb-3 opacity-20" />
                        <div className="text-[var(--text-muted)] font-medium">データが見つかりませんでした</div>
                    </div>
                )}

                {!hasSearched && !isPending && (
                    <div className="card-static stagger-item text-center py-20 px-4">
                        <div className="inline-flex p-6 rounded-full bg-indigo-500/5 mb-6 animate-pulse">
                            <Microscope size={64} className="text-indigo-500/40" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-2">
                            分析を開始
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
                            機種を選んで、台ごとの詳細なデータ傾向やイベント日の信頼度を分析します。
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}


