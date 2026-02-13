'use client'

import { useState, useTransition } from 'react'
import { getSummary, MachineSummary, MachineNoSummary } from '@/lib/actions'
import { getTodayJst, getPastDateJst } from '@/lib/dateUtils'
import { PageHeader } from '@/components/PageHeader'
import { BarChart3, Search, PieChart, ArrowUpDown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
    machines: { id: string; name: string }[]
}

// 差枚数の表示テキスト
function formatDiff(diff: number): string {
    if (diff > 0) return `+${diff.toLocaleString()}`
    return diff.toLocaleString()
}

export default function SummaryClient({ machines }: Props) {
    const todayStr = getTodayJst()
    const weekAgoStr = getPastDateJst(14) // Default to 2 weeks for better visibility

    const [startDate, setStartDate] = useState(weekAgoStr)
    const [endDate, setEndDate] = useState(todayStr)
    const [machineSummary, setMachineSummary] = useState<MachineSummary[]>([])
    const [machineNoSummary, setMachineNoSummary] = useState<MachineNoSummary[]>([])
    const [selectedMachineId, setSelectedMachineId] = useState('')
    const [isPending, startTransition] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)
    const [sortKey, setSortKey] = useState<'totalDiff' | 'machineNo' | 'totalBig' | 'totalReg' | 'avgDiff'>('totalDiff')
    const [sortAsc, setSortAsc] = useState(false) // Default to desc for diff

    const handleSearch = () => {
        startTransition(async () => {
            const result = await getSummary(new Date(startDate), new Date(endDate))
            setMachineSummary(result.machineSummary)
            setMachineNoSummary(result.machineNoSummary)
            setHasSearched(true)
        })
    }

    const handleSort = (key: typeof sortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc)
        } else {
            setSortKey(key)
            setSortAsc(key === 'machineNo') // Default asc for machineNo, desc for others
        }
    }

    const sortedMachineNo = [...machineNoSummary]
        .filter(m => selectedMachineId ? m.machineId === selectedMachineId : true)
        .sort((a, b) => {
            let diff = 0
            if (sortKey === 'machineNo') diff = a.machineNo - b.machineNo
            else diff = a[sortKey] - b[sortKey]
            return sortAsc ? diff : -diff
        })

    const hasDetails = sortedMachineNo.some(m => (m.totalGames || 0) > 0 || (m.totalBig || 0) > 0 || (m.totalReg || 0) > 0)

    // 全体合計
    const grandTotal = machineSummary.reduce((a, b) => a + b.totalDiff, 0)

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            {/* ページヘッダー */}
            {/* ページヘッダー */}
            <PageHeader
                title="集計ダッシュボード"
                subtitle="期間別パフォーマンス分析とインサイト"
                startAdornment={<PieChart size={20} />}
            />

            <div className="space-y-6">
                {/* 検索バー */}
                <div className="card-static stagger-item">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                        <div className="flex-1 min-w-0 max-w-[150px]">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">開始日</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-modern tabular-nums"
                            />
                        </div>
                        <div className="flex-1 min-w-0 max-w-[150px]">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">終了日</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-modern tabular-nums"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isPending}
                            className="btn-primary sm:w-auto h-[42px] flex items-center justify-center gap-2"
                            style={{ minWidth: '120px' }}
                        >
                            {isPending ? (
                                <>
                                    <span className="animate-spin">⏳</span> 集計中...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} /> 集計実行
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ローディングスケルトン */}
                {isPending && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="card-static p-6 space-y-3">
                                    <Skeleton className="h-3 w-1/2" />
                                    <Skeleton className="h-8 w-3/4" />
                                </div>
                            ))}
                        </div>
                        <div className="card-static p-8">
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </div>
                )}

                {hasSearched && !isPending && (
                    <>
                        {/* 機種サマリーカード */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {machineSummary.map((m) => (
                                <button
                                    key={m.machineId}
                                    onClick={() => setSelectedMachineId(selectedMachineId === m.machineId ? '' : m.machineId)}
                                    className="card text-left stagger-item relative overflow-hidden group"
                                    style={{
                                        cursor: 'pointer',
                                        borderColor: selectedMachineId === m.machineId ? 'var(--accent)' : undefined,
                                        background: selectedMachineId === m.machineId ? 'rgba(99, 102, 241, 0.15)' : undefined,
                                    }}
                                >
                                    <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 group-hover:text-[var(--text-primary)] transition-colors">
                                        {m.machineName}
                                    </div>
                                    <div
                                        className={`stat-value glow-value text-xl sm:text-2xl tabular-nums ${m.totalDiff > 0 ? 'diff-plus' : m.totalDiff < 0 ? 'diff-minus' : 'diff-zero'}`}
                                    >
                                        {formatDiff(m.totalDiff)}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-2 flex justify-between items-center">
                                        <span>{m.count}件</span>
                                        {hasDetails && (
                                            <span className="opacity-70">
                                                B{m.totalBig} R{m.totalReg}
                                            </span>
                                        )}
                                    </div>
                                    {selectedMachineId === m.machineId && (
                                        <div className="absolute inset-0 border-2 border-[var(--accent)] rounded-2xl pointer-events-none" />
                                    )}
                                </button>
                            ))}
                            {/* 合計カード */}
                            <button
                                onClick={() => setSelectedMachineId('')}
                                className="card text-left stagger-item relative overflow-hidden group"
                                style={{
                                    cursor: 'pointer',
                                    borderColor: selectedMachineId === '' ? 'var(--accent-secondary)' : undefined,
                                    background: selectedMachineId === '' ? 'rgba(34, 211, 238, 0.1)' : undefined,
                                }}
                            >
                                <div className="text-xs font-semibold text-[var(--accent-secondary)] mb-2">
                                    全機種合計
                                </div>
                                <div
                                    className={`stat-value glow-value text-xl sm:text-2xl tabular-nums ${grandTotal > 0 ? 'diff-plus' : grandTotal < 0 ? 'diff-minus' : 'diff-zero'}`}
                                >
                                    {formatDiff(grandTotal)}
                                </div>
                                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-2">
                                    合計 {machineSummary.reduce((a, b) => a + b.count, 0)}件
                                </div>
                                {selectedMachineId === '' && (
                                    <div className="absolute inset-0 border-2 border-[var(--accent-secondary)] rounded-2xl pointer-events-none" />
                                )}
                            </button>
                        </div>

                        {/* 台別テーブル */}
                        <div className="card-static stagger-item p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/5 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-500/10 p-1.5 rounded text-indigo-400">
                                        <ArrowUpDown size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                                            台別パフォーマンス詳細
                                        </h2>
                                        <span className="text-xs text-[var(--text-muted)] tabular-nums">
                                            {startDate.replace(/-/g, '.')} - {endDate.replace(/-/g, '.')}
                                        </span>
                                    </div>
                                </div>
                                <select
                                    value={selectedMachineId}
                                    onChange={(e) => setSelectedMachineId(e.target.value)}
                                    className="select-modern text-xs py-1.5 px-3 w-full sm:w-auto"
                                >
                                    <option value="">全機種を表示</option>
                                    {machines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table-jat">
                                    <thead>
                                        <tr>
                                            <th className="cursor-pointer select-none group" onClick={() => handleSort('machineNo')} style={{ width: '80px', paddingLeft: '1.25rem' }}>
                                                <div className="flex items-center gap-1">
                                                    台番
                                                    {sortKey === 'machineNo' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                                </div>
                                            </th>
                                            {hasDetails && (
                                                <>
                                                    <th className="cursor-pointer select-none text-center w-16" onClick={() => handleSort('totalBig')}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            BIG
                                                            {sortKey === 'totalBig' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                                        </div>
                                                    </th>
                                                    <th className="cursor-pointer select-none text-center w-16" onClick={() => handleSort('totalReg')}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            REG
                                                            {sortKey === 'totalReg' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                                        </div>
                                                    </th>
                                                    <th className="text-center w-24">G数</th>
                                                </>
                                            )}
                                            <th className="cursor-pointer select-none text-right w-32 pr-5" onClick={() => handleSort('totalDiff')}>
                                                <div className="flex items-center justify-end gap-1">
                                                    差枚
                                                    {sortKey === 'totalDiff' && (sortAsc ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />)}
                                                </div>
                                            </th>
                                            {!selectedMachineId && <th className="text-left pl-4">機種名</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedMachineNo.map((m) => (
                                            <tr key={`${m.machineId}-${m.machineNo}`} className="group hover:bg-white/5 transition-colors">
                                                <td className="pl-5 py-3 font-semibold tabular-nums">
                                                    <a
                                                        href={`/history/${m.machineId}/${m.machineNo}`}
                                                        className="text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 decoration-indigo-500/30"
                                                    >
                                                        {m.machineNo}
                                                    </a>
                                                </td>
                                                {hasDetails && (
                                                    <>
                                                        <td className="text-center py-3 tabular-nums text-rose-400/90 font-medium">
                                                            {m.totalBig || '-'}
                                                        </td>
                                                        <td className="text-center py-3 tabular-nums text-sky-400/90 font-medium">
                                                            {m.totalReg || '-'}
                                                        </td>
                                                        <td className="text-center py-3 tabular-nums text-[var(--text-secondary)]">
                                                            {m.totalGames ? m.totalGames.toLocaleString() : '-'}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="text-right py-3 pr-5 tabular-nums">
                                                    <span className={`font-bold ${m.totalDiff > 0 ? 'text-plus' : m.totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                        {formatDiff(m.totalDiff)}
                                                    </span>
                                                </td>
                                                {!selectedMachineId && (
                                                    <td className="text-left pl-4 py-3 text-xs text-[var(--text-muted)]">
                                                        {m.machineName}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {sortedMachineNo.length === 0 && (
                                <div className="py-8">
                                    <EmptyState
                                        icon={BarChart3}
                                        title="データがありません"
                                        description="表示するデータが見つかりませんでした。"
                                        className="border-none bg-transparent"
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {!hasSearched && !isPending && (
                    <div className="card-static stagger-item text-center py-20 px-4">
                        <div className="inline-flex p-6 rounded-full bg-indigo-500/5 mb-6 animate-pulse">
                            <BarChart3 size={64} className="text-indigo-500/40" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-2">
                            集計分析を開始
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
                            期間を指定して、店舗全体のパフォーマンスや機種別の傾向を可視化します。
                        </p>
                        {/* 矢印で検索ボタンを指すようなデザインも可能だが今回はシンプルに */}
                    </div>
                )}
            </div>
        </div>
    )
}
