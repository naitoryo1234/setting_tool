'use client'

import { useState, useTransition, useEffect } from 'react'
import { getAnalysis, getMachines, toggleEventDay, AnalysisResult, getSummary, MachineSummary, MachineNoSummary } from '@/lib/actions'
import { getTodayJst, getPastDateJst } from '@/lib/dateUtils'
import { Microscope, Search, Calendar, CalendarCheck2, TrendingUp, AlertCircle, BarChart2, Hash, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, RotateCw, Sparkles, Coins, Inbox, PieChart } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

type Store = {
    id: string
    name: string
}

function SortButton({ label, active, asc, activeClass = 'bg-[var(--primary)] text-white border-[var(--primary)]', activeStyle, onClick }: { label: string, active: boolean, asc: boolean, activeClass?: string, activeStyle?: React.CSSProperties, onClick: () => void }) {
    // Tailwind needs to see the full class names statically.
    // The activeClass prop is passed as a complete string, so it should be fine.
    return (
        <button
            onClick={onClick}
            style={active && activeStyle ? activeStyle : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm
            ${active
                    ? activeClass
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
                }`}
        >
            {label}
            {active && (
                <ArrowUpDown size={12} className={`transition-transform duration-300 ${asc ? 'rotate-180' : ''}`} />
            )}
        </button>
    )
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
    const [endDate, setEndDate] = useState(getTodayJst())
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

    // 全機種集計用
    const [machineSummary, setMachineSummary] = useState<MachineSummary[]>([])
    const [machineNoSummary, setMachineNoSummary] = useState<MachineNoSummary[]>([])
    const [selectedSummaryMachineId, setSelectedSummaryMachineId] = useState('')
    const isSummaryMode = machineId === '__all__'

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
            if (machineId === '__all__') {
                // 全機種集計モード
                const s = useRange && startDate && endDate
                    ? new Date(startDate)
                    : new Date('2020-01-01')
                const e = useRange && startDate && endDate
                    ? new Date(endDate)
                    : new Date(getTodayJst())
                const summaryResult = await getSummary(s, e)
                setMachineSummary(summaryResult.machineSummary)
                setMachineNoSummary(summaryResult.machineNoSummary)
                setResult(null)
            } else {
                // 単一機種分析モード
                const start = useRange && startDate ? new Date(startDate) : undefined
                const end = useRange && endDate ? new Date(endDate) : undefined
                const data = await getAnalysis(machineId, start, end, dayFilter)
                setResult(data)
                setMachineSummary([])
                setMachineNoSummary([])
            }
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
        <div className="animate-fade-in max-w-6xl mx-auto space-y-4 md:space-y-8">
            {/* ページヘッダー */}
            {/* ページヘッダー */}
            <PageHeader
                title="深掘り分析"
                subtitle="台番・曜日・イベント日別の傾向を探る"
                startAdornment={<Microscope size={20} />}
            />

            <div className="space-y-6">
                {/* 検索条件 */}
                <div className="card-static stagger-item p-6 border border-[var(--border-color)] bg-[var(--bg-card)]">
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
                                <option value="__all__">── 全機種集計 ──</option>
                                {machines.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1 h-6">
                                <input type="checkbox" id="useRange" checked={useRange} onChange={(e) => setUseRange(e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[var(--primary)] focus:ring-offset-0 focus:ring-[var(--primary)]"
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
                                <span>{isPending ? '分析中...' : isSummaryMode ? '集計実行' : '分析実行'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* イベント日登録 */}
                <div className="card-static stagger-item p-4 border border-[var(--border-color)] bg-[var(--bg-card)]">
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
                            className="btn-primary py-1.5 px-3 text-xs border-none shadow-lg"
                        >
                            登録 / 解除
                        </button>
                        {eventMsg && <span className="text-xs animate-success text-[var(--primary)] flex items-center gap-1"><AlertCircle size={12} /> {eventMsg}</span>}
                    </div>
                </div>

                {/* スケルトンローディング */}
                {isPending && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="card-static p-6 space-y-3">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-8 w-3/4" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 結果 */}
                {hasSearched && !isPending && result && (
                    <>
                        {/* 全体サマリー */}
                        <div className="card-static stagger-item border border-[var(--border-color)] bg-[var(--bg-card)]">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
                                <BarChart2 size={20} className="text-[var(--primary)]" />
                                <span className="text-[var(--text-primary)] font-bold">
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
                                    { label: 'BIG回数', value: result.overall.totalBig.toString(), sub: `1/${result.overall.bigProb}`, color: 'var(--color-plus)', icon: <ArrowUp size={14} className="opacity-50" /> },
                                    { label: 'REG回数', value: result.overall.totalReg.toString(), sub: `1/${result.overall.regProb}`, color: 'var(--accent-secondary)', icon: <ArrowDown size={14} className="opacity-50" /> },
                                    { label: '推定出玉率', value: `${result.overall.payoutRate.toFixed(1)}%`, color: result.overall.payoutRate >= 100 ? 'var(--color-plus)' : 'var(--text-muted)', icon: <TrendingUp size={14} className="opacity-50" />, isRate: true },
                                ].map((stat, i) => (
                                    <div key={i} className={`card p-4 text-center relative overflow-hidden group border border-[var(--border-color)] bg-[var(--bg-card)] ${(stat as any).isRate && parseFloat(stat.value) >= 106 ? 'ai-pulse-bad' : (stat as any).isRate && parseFloat(stat.value) >= 100 ? 'ai-pulse-good' : ''}`}>
                                        <div className="text-[10px] text-[var(--text-muted)] mb-2 uppercase tracking-wider flex justify-center items-center gap-1">
                                            {(stat as any).icon} {stat.label}
                                        </div>
                                        <div className="stat-value glow-value text-xl md:text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
                                        {(stat as any).sub && <div className="text-[10px] text-[var(--text-muted)] mt-1 tabular-nums">{(stat as any).sub}</div>}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/15 text-center flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="text-[10px] text-[var(--primary)]/70 mb-1 uppercase tracking-wider font-semibold">合算確率 (BIG+REG)</div>
                                <div className="stat-value glow-value text-3xl font-black text-[var(--primary)] tabular-nums z-10">
                                    1/{result.overall.hitProb}
                                </div>
                                <div className="text-xs text-[var(--text-muted)] mt-1 tabular-nums z-10">
                                    ({result.overall.totalHits} hits / {result.overall.totalGames.toLocaleString()}G)
                                </div>
                            </div>
                        </div>

                        {/* タブ */}
                        <div className="card-static stagger-item p-0 overflow-hidden border border-[var(--border-color)]">
                            <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
                                {[
                                    { id: 'machine' as TabType, label: '台番別解析', icon: <Hash size={14} /> },
                                    { id: 'dow' as TabType, label: '曜日別解析', icon: <CalendarDays size={14} /> },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-[var(--primary)] bg-[var(--primary)]/5' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'}`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}
                                    </button>
                                ))}
                            </div>

                            <div>
                                {/* 台番別テーブル */}
                                {activeTab === 'machine' && (
                                    <>
                                        {/* Mobile View (2-row list) */}
                                        <div className="md:hidden">
                                            <div className="flex flex-wrap gap-2 p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                                                <SortButton label="台番" active={sortKey === 'machineNo'} asc={sortAsc} onClick={() => handleSort('machineNo')} />
                                                <SortButton
                                                    label="差枚"
                                                    active={sortKey === 'totalDiff'}
                                                    asc={sortAsc}
                                                    activeClass="text-white"
                                                    activeStyle={{ backgroundColor: !sortAsc ? 'var(--color-plus)' : 'var(--color-minus)', borderColor: !sortAsc ? 'var(--color-plus)' : 'var(--color-minus)' }}
                                                    onClick={() => handleSort('totalDiff')}
                                                />
                                                <SortButton
                                                    label="出玉率"
                                                    active={sortKey === 'payoutRate'}
                                                    asc={sortAsc}
                                                    activeClass="text-white"
                                                    activeStyle={{ backgroundColor: !sortAsc ? 'var(--color-plus)' : 'var(--color-minus)', borderColor: !sortAsc ? 'var(--color-plus)' : 'var(--color-minus)' }}
                                                    onClick={() => handleSort('payoutRate')}
                                                />
                                                <SortButton
                                                    label="合算"
                                                    active={sortKey === 'hitProb'}
                                                    asc={sortAsc}
                                                    activeClass="text-white"
                                                    activeStyle={{ backgroundColor: sortAsc ? 'var(--color-plus)' : 'var(--color-minus)', borderColor: sortAsc ? 'var(--color-plus)' : 'var(--color-minus)' }}
                                                    onClick={() => handleSort('hitProb')}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                {sortedRecords.map((r) => (
                                                    <a key={r.machineNo} href={`/history/${result.machineId}/${r.machineNo}`} className="block border-b border-[var(--border-color)] p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                                                        {/* 1段目: 台番・差枚・出玉率 */}
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="font-bold text-[var(--text-primary)] tabular-nums flex items-center gap-2">
                                                                #{r.machineNo}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm font-bold">
                                                                <span className={r.totalDiff > 0 ? 'text-plus' : r.totalDiff < 0 ? 'text-minus' : 'text-zero'}>
                                                                    {r.totalDiff > 0 ? '+' : ''}{r.totalDiff.toLocaleString()}
                                                                </span>
                                                                <span className={r.payoutRate >= 100 ? 'text-plus' : 'text-minus'}>{r.payoutRate}%</span>
                                                            </div>
                                                        </div>
                                                        {/* 2段目: 稼働・確率 */}
                                                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                                            <div className="flex items-center gap-3">
                                                                <span>稼働: {r.days}日 / {r.totalGames.toLocaleString()}G</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 tabular-nums">
                                                                <span className="text-rose-400">BB 1/{r.bigProb}</span>
                                                                <span className="text-[var(--accent-secondary)]">RB 1/{r.regProb}</span>
                                                                <span className="font-medium text-[var(--text-primary)]">合算 1/{r.hitProb}</span>
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                                {/* 全体サマリー行 (Mobile) */}
                                                <div className="p-4 bg-[var(--bg-elevated)] text-xs border-t-2 border-[var(--border-color)]">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold">全体サマリー</span>
                                                        <span className={`font-bold ${result.overall.totalDiff > 0 ? 'text-plus' : 'text-minus'}`}>
                                                            {result.overall.totalDiff > 0 ? '+' : ''}{result.overall.totalDiff.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-[var(--text-muted)] flex justify-between">
                                                        <span>{result.overall.days}日 / {result.overall.totalGames.toLocaleString()}G</span>
                                                        <span>合算 1/{result.overall.hitProb} ({result.overall.payoutRate}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop View (Table) */}
                                        <div className="hidden md:block overflow-x-auto">
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
                                                                <a href={`/history/${result.machineId}/${r.machineNo}`} className="text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline underline-offset-4 decoration-[var(--primary)]/30">
                                                                    {r.machineNo}
                                                                </a>
                                                            </td>
                                                            <td className="text-right py-3 tabular-nums">{r.days}</td>
                                                            <td className="text-right py-3 tabular-nums text-[var(--text-secondary)]">{r.totalGames.toLocaleString()}</td>
                                                            <td className="text-right py-3 tabular-nums text-rose-400">{r.totalBig}</td>
                                                            <td className="text-right py-3 tabular-nums text-[var(--accent-secondary)]">{r.totalReg}</td>
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
                                                    <tr className="bg-[var(--bg-elevated)] font-bold border-t border-[var(--border-color)]">
                                                        <td className="pl-4 py-4">全体</td>
                                                        <td className="text-right py-4 tabular-nums">{result.overall.days}</td>
                                                        <td className="text-right py-4 tabular-nums">{result.overall.totalGames.toLocaleString()}</td>
                                                        <td className="text-right py-4 tabular-nums text-rose-400">{result.overall.totalBig}</td>
                                                        <td className="text-right py-4 tabular-nums text-[var(--accent-secondary)]">{result.overall.totalReg}</td>
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
                                    </>
                                )}

                                {/* 曜日別テーブル */}
                                {activeTab === 'dow' && (
                                    <>
                                        {/* Mobile View (2-row list) */}
                                        <div className="md:hidden flex flex-col">
                                            {result.dowSummary.map((d) => (
                                                <div key={d.dow} className="block border-b border-[var(--border-color)] p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                                                    {/* 1段目: 曜日・差枚・出玉率 */}
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="font-bold tabular-nums flex items-center gap-2" style={{ color: d.dow === 0 ? '#f43f5e' : d.dow === 6 ? '#38bdf8' : 'var(--text-primary)' }}>
                                                            {d.dowLabel}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm font-bold">
                                                            <span className={d.totalDiff > 0 ? 'text-plus' : d.totalDiff < 0 ? 'text-minus' : 'text-zero'}>
                                                                {d.totalDiff > 0 ? '+' : ''}{d.totalDiff.toLocaleString()}
                                                            </span>
                                                            <span className={d.payoutRate >= 100 ? 'text-plus' : 'text-minus'}>{d.payoutRate}%</span>
                                                        </div>
                                                    </div>
                                                    {/* 2段目: 稼働・確率 */}
                                                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                                        <div className="flex items-center gap-3">
                                                            <span>稼働: {d.days}日 / {d.totalGames.toLocaleString()}G</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 tabular-nums">
                                                            <span className="text-rose-400">BB {d.totalBig}回</span>
                                                            <span className="text-[var(--accent-secondary)]">RB {d.totalReg}回</span>
                                                            <span className="font-medium text-[var(--text-primary)]">合算 1/{d.hitProb}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {result.dowSummary.length === 0 && (
                                                <div className="py-16 text-center text-[var(--text-muted)]">
                                                    <Inbox size={48} className="mx-auto mb-3 opacity-20" />
                                                    データがありません
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop View (Table) */}
                                        <div className="hidden md:block overflow-x-auto">
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
                                                            <td className="text-right py-3 tabular-nums text-[var(--accent-secondary)]">{d.totalReg}</td>
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
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {hasSearched && !isPending && !result && machineSummary.length === 0 && (
                    <EmptyState
                        icon={Search}
                        title="データが見つかりませんでした"
                        description="指定条件のデータが存在しないか、集計期間外です。"
                    />
                )}

                {/* 全機種集計結果 */}
                {hasSearched && !isPending && machineSummary.length > 0 && (
                    <>
                        {/* 機種サマリーカード */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {machineSummary.map((m) => (
                                <button
                                    key={m.machineId}
                                    onClick={() => setSelectedSummaryMachineId(selectedSummaryMachineId === m.machineId ? '' : m.machineId)}
                                    className={`card text-left stagger-item relative overflow-hidden group ${selectedSummaryMachineId === m.machineId ? 'border-[var(--primary)] bg-[var(--bg-card-solid)]' : ''}`}
                                >
                                    <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 group-hover:text-[var(--text-primary)] transition-colors">
                                        {m.machineName}
                                    </div>
                                    <div className={`stat-value text-xl sm:text-2xl tabular-nums ${m.totalDiff > 0 ? 'diff-plus' : m.totalDiff < 0 ? 'diff-minus' : 'diff-zero'}`}>
                                        {m.totalDiff > 0 ? '+' : ''}{m.totalDiff.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-2 flex justify-between items-center">
                                        <span>{m.count}件</span>
                                        <span className="opacity-70">B{m.totalBig} R{m.totalReg}</span>
                                    </div>
                                </button>
                            ))}
                            {/* 合計カード */}
                            <button
                                onClick={() => setSelectedSummaryMachineId('')}
                                className={`card text-left stagger-item relative overflow-hidden group ${selectedSummaryMachineId === '' ? 'border-[var(--primary)] bg-[var(--bg-card-solid)]' : ''}`}
                            >
                                <div className="text-xs font-semibold text-[var(--primary)] mb-2">全機種合計</div>
                                <div className={`stat-value text-xl sm:text-2xl tabular-nums ${machineSummary.reduce((a, b) => a + b.totalDiff, 0) > 0 ? 'diff-plus' : 'diff-minus'}`}>
                                    {machineSummary.reduce((a, b) => a + b.totalDiff, 0) > 0 ? '+' : ''}{machineSummary.reduce((a, b) => a + b.totalDiff, 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-2">
                                    合計 {machineSummary.reduce((a, b) => a + b.count, 0)}件
                                </div>
                            </button>
                        </div>

                        {/* 台別テーブル */}
                        <div className="card-static stagger-item p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                    台別パフォーマンス詳細
                                </h2>
                                <select
                                    value={selectedSummaryMachineId}
                                    onChange={(e) => setSelectedSummaryMachineId(e.target.value)}
                                    className="select-modern text-xs w-auto"
                                >
                                    <option value="">全機種</option>
                                    {machineSummary.map(m => (
                                        <option key={m.machineId} value={m.machineId}>{m.machineName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Mobile View (2-row list) */}
                            <div className="md:hidden flex flex-col">
                                {machineNoSummary
                                    .filter(m => selectedSummaryMachineId ? m.machineId === selectedSummaryMachineId : true)
                                    .sort((a, b) => b.totalDiff - a.totalDiff)
                                    .map((m) => (
                                        <div key={`${m.machineId}-${m.machineNo}`} className="block border-b border-[var(--border-color)] p-4">
                                            {/* 1段目: 機種名・台番・差枚 */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-[10px] text-[var(--text-muted)] leading-tight mb-0.5">
                                                        {m.machineName}
                                                    </div>
                                                    <div className="font-bold text-[var(--text-primary)] tabular-nums flex items-center gap-2">
                                                        <a href={`/history/${m.machineId}/${m.machineNo}`} className="text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline">
                                                            #{m.machineNo}
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm font-bold">
                                                    <span className={`font-bold ${m.totalDiff > 0 ? 'text-plus' : m.totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                        {m.totalDiff > 0 ? '+' : ''}{m.totalDiff.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* 2段目: 稼働・確率 */}
                                            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                                <div className="flex items-center gap-3">
                                                    <span>稼働: {m.totalGames ? m.totalGames.toLocaleString() : '-'}G</span>
                                                </div>
                                                <div className="flex items-center gap-2 tabular-nums">
                                                    <span className="text-rose-400">BB {m.totalBig || '-'}</span>
                                                    <span className="text-[var(--accent-secondary)]">RB {m.totalReg || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Desktop View (Table) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="table-jat w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th className="pl-5 text-left">No</th>
                                            <th className="text-center">BIG</th>
                                            <th className="text-center">REG</th>
                                            <th className="text-center">G数</th>
                                            <th className="text-right pr-5">差枚</th>
                                            {!selectedSummaryMachineId && <th className="text-left pl-4">機種名</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {machineNoSummary
                                            .filter(m => selectedSummaryMachineId ? m.machineId === selectedSummaryMachineId : true)
                                            .sort((a, b) => b.totalDiff - a.totalDiff)
                                            .map((m) => (
                                                <tr key={`${m.machineId}-${m.machineNo}`} className="group hover:bg-white/5 transition-colors">
                                                    <td className="pl-5 py-3 font-semibold tabular-nums">
                                                        <a href={`/history/${m.machineId}/${m.machineNo}`} className="text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline">
                                                            {m.machineNo}
                                                        </a>
                                                    </td>
                                                    <td className="text-center py-3 tabular-nums text-rose-400/90 font-medium">{m.totalBig || '-'}</td>
                                                    <td className="text-center py-3 tabular-nums text-[var(--accent-secondary)] font-medium">{m.totalReg || '-'}</td>
                                                    <td className="text-center py-3 tabular-nums text-[var(--text-secondary)]">{m.totalGames ? m.totalGames.toLocaleString() : '-'}</td>
                                                    <td className="text-right py-3 pr-5 tabular-nums">
                                                        <span className={`font-bold ${m.totalDiff > 0 ? 'text-plus' : m.totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                            {m.totalDiff > 0 ? '+' : ''}{m.totalDiff.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    {!selectedSummaryMachineId && (
                                                        <td className="text-left pl-4 py-3 text-xs text-[var(--text-muted)]">{m.machineName}</td>
                                                    )}
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {!hasSearched && !isPending && (
                    <div className="card-static stagger-item text-center py-20 px-4">
                        <div className="inline-flex p-6 rounded-full bg-[var(--primary)]/5 mb-6 animate-pulse">
                            <Microscope size={64} className="text-[var(--primary)]/40" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-2">
                            分析を開始
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
                            機種を選んで詳細分析、または「全機種集計」で店舗全体の傾向を確認できます。
                        </p>
                    </div>
                )}
            </div>
        </div >
    )
}


