'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { getAnalysis, AnalysisResult } from '@/lib/actions'
import { getTodayJst } from '@/lib/dateUtils'
import { ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, Info, Calendar, Filter, X } from 'lucide-react'

type Props = {
    analysis: AnalysisResult
}

type SortKey = 'machineNo' | 'totalGames' | 'totalDiff' | 'bigProb' | 'regProb' | 'hitProb' | 'payoutRate' | 'winRate'

export default function MachineModelSummaryClient({ analysis: initialAnalysis }: Props) {
    const [analysis, setAnalysis] = useState(initialAnalysis)
    const [sortKey, setSortKey] = useState<SortKey>('machineNo')
    const [sortAsc, setSortAsc] = useState(true)
    const [showFilter, setShowFilter] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState(getTodayJst())
    const [isFiltered, setIsFiltered] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc)
        } else {
            setSortKey(key)
            if (key === 'totalDiff' || key === 'payoutRate' || key === 'winRate' || key === 'totalGames') {
                setSortAsc(false)
            } else if (key === 'bigProb' || key === 'regProb' || key === 'hitProb') {
                setSortAsc(true)
            } else {
                setSortAsc(true)
            }
        }
    }

    const handleFilterApply = () => {
        if (!startDate || !endDate) return
        startTransition(async () => {
            const result = await getAnalysis(analysis.machineId, new Date(startDate), new Date(endDate))
            if (result) {
                setAnalysis(result)
                setIsFiltered(true)
                setShowFilter(false)
            }
        })
    }

    const handleFilterClear = () => {
        startTransition(async () => {
            const result = await getAnalysis(analysis.machineId)
            if (result) {
                setAnalysis(result)
                setIsFiltered(false)
                setStartDate('')
                setEndDate('')
            }
        })
    }

    // Clone and sort
    const sortedRecords = [...analysis.records].sort((a, b) => {
        let valA = 0
        let valB = 0

        switch (sortKey) {
            case 'machineNo': valA = a.machineNo; valB = b.machineNo; break;
            case 'totalGames': valA = a.totalGames; valB = b.totalGames; break;
            case 'totalDiff': valA = a.totalDiff; valB = b.totalDiff; break;
            case 'bigProb': valA = a.bigProb || 9999; valB = b.bigProb || 9999; break;
            case 'regProb': valA = a.regProb || 9999; valB = b.regProb || 9999; break;
            case 'hitProb': valA = a.hitProb || 9999; valB = b.hitProb || 9999; break;
            case 'payoutRate': valA = a.payoutRate; valB = b.payoutRate; break;
        }

        if (valA === valB) return 0
        return sortAsc ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1)
    })

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
            <PageHeader
                title={`${analysis.machineName} 全台データ一覧`}
                subtitle="台番号別 パフォーマンス比較・分析"
                startAdornment={<LayoutGrid size={20} />}
                backHref="/machines"
            />

            <div className="card-static p-0 overflow-hidden border border-[var(--border-color)]">
                <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            パフォーマンス一覧 ({analysis.records.length}台)
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="text-xs text-[var(--text-muted)] hidden sm:flex gap-4">
                                <span>総稼働: {analysis.overall.totalGames.toLocaleString()}G</span>
                                <span>平均RB: 1/{analysis.overall.regProb}</span>
                                <span>機械割: {analysis.overall.payoutRate}%</span>
                            </div>
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${isFiltered
                                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10'
                                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                                    }`}
                            >
                                <Filter size={12} />
                                {isFiltered ? '期間指定中' : '期間指定'}
                            </button>
                        </div>
                    </div>

                    {/* 期間フィルターパネル */}
                    {showFilter && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-end gap-3">
                            <div>
                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">開始日</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input-modern text-xs tabular-nums"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">終了日</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input-modern text-xs tabular-nums"
                                />
                            </div>
                            <button
                                onClick={handleFilterApply}
                                disabled={!startDate || !endDate || isPending}
                                className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                            >
                                {isPending ? '読込中...' : '適用'}
                            </button>
                            {isFiltered && (
                                <button
                                    onClick={handleFilterClear}
                                    disabled={isPending}
                                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2 py-2"
                                >
                                    <X size={12} />
                                    全期間に戻す
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="table-jat w-full text-sm">
                        <thead>
                            <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border-color)]">
                                <th className="pl-5 py-3 w-20 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('machineNo')}>
                                    <div className="flex items-center gap-1">
                                        No
                                        {sortKey === 'machineNo' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                    </div>
                                </th>
                                <th className="py-3 w-24 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('totalGames')}>
                                    <div className="flex items-center justify-end gap-1">
                                        G数
                                        {sortKey === 'totalGames' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                    </div>
                                </th>
                                <th className="py-3 w-28 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('totalDiff')}>
                                    <div className="flex items-center justify-end gap-1">
                                        差枚
                                        {sortKey === 'totalDiff' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                    </div>
                                </th>
                                <th className="py-3 w-24 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('bigProb')}>
                                    <div className="flex items-center justify-end gap-1">
                                        BB確率
                                        {sortKey === 'bigProb' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                    </div>
                                </th>
                                <th className="py-3 w-24 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('regProb')}>
                                    <div className="flex items-center justify-end gap-1">
                                        RB確率
                                        {sortKey === 'regProb' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                    </div>
                                </th>
                                <th className="py-3 w-24 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('hitProb')}>
                                    <div className="flex items-center justify-end gap-1">
                                        合算
                                        {sortKey === 'hitProb' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                    </div>
                                </th>
                                <th className="py-3 w-28 text-right pr-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('payoutRate')}>
                                    <div className="flex items-center justify-end gap-1">
                                        機械割
                                        {sortKey === 'payoutRate' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRecords.map((r) => (
                                <tr key={r.machineNo} className="group hover:bg-white/5 transition-colors border-b border-[var(--border-color)] last:border-0">
                                    <td className="pl-5 py-3 font-bold tabular-nums relative">
                                        <Link
                                            href={`/history/${analysis.machineId}/${r.machineNo}`}
                                            className="before:absolute before:inset-0 before:content-['']"
                                        >
                                            <span className="text-white group-hover:text-[var(--accent)] transition-colors">{r.machineNo}</span>
                                        </Link>
                                    </td>
                                    <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">
                                        {r.totalGames.toLocaleString()}
                                    </td>
                                    <td className={`py-3 text-right tabular-nums font-bold ${r.totalDiff > 0 ? 'diff-plus' : r.totalDiff < 0 ? 'diff-minus' : 'diff-zero'}`}>
                                        {r.totalDiff > 0 ? '+' : ''}{r.totalDiff.toLocaleString()}
                                    </td>
                                    <td className="py-3 text-right tabular-nums">
                                        <div className="text-xs text-[var(--text-muted)] leading-none mb-0.5">{r.totalBig}回</div>
                                        <div className="text-rose-400 font-medium">1/{r.bigProb}</div>
                                    </td>
                                    <td className="py-3 text-right tabular-nums">
                                        <div className="text-xs text-[var(--text-muted)] leading-none mb-0.5">{r.totalReg}回</div>
                                        <div className="text-[var(--accent-secondary)] font-medium">1/{r.regProb}</div>
                                    </td>
                                    <td className="py-3 text-right tabular-nums">
                                        <div className="text-xs text-[var(--text-muted)] leading-none mb-0.5">{r.totalHits}回</div>
                                        <div className="text-[var(--accent)] font-medium">1/{r.hitProb}</div>
                                    </td>
                                    <td className="py-3 text-right pr-5 tabular-nums">
                                        <span className={`font-bold ${r.payoutRate >= 105 ? 'text-rose-400' : r.payoutRate >= 100 ? 'text-white' : 'text-blue-400'}`}>
                                            {r.payoutRate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="text-center text-xs text-[var(--text-muted)] mt-4 flex items-center justify-center gap-2">
                <Info size={14} />
                <span>各行をクリックすると詳細ページへ遷移します</span>
            </div>
        </div>
    )
}
