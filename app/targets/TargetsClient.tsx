'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { MachineWithNumbers, getTargetMachines, MachineTargetData } from '@/lib/actions'
import { PageHeader } from '@/components/PageHeader'
import { Calendar, Crosshair, Search, TrendingDown } from 'lucide-react'

type Props = {
    machines: MachineWithNumbers[]
}

export function TargetsClient({ machines }: Props) {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
    const [results, setResults] = useState<MachineTargetData[]>([])
    const [isPending, startTransition] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = () => {
        startTransition(async () => {
            const data = await getTargetMachines(new Date(startDate), new Date(endDate))
            setResults(data)
            setHasSearched(true)
        })
    }

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return "bg-yellow-500 text-black border-yellow-500"
            case 2: return "bg-slate-300 text-slate-900 border-slate-300"
            case 3: return "bg-orange-700 text-white border-orange-700"
            default: return "bg-slate-700 text-slate-300 border-slate-700"
        }
    }

    const getRankLabel = (rank: number) => {
        switch (rank) {
            case 1: return "1st"
            case 2: return "2nd"
            case 3: return "3rd"
            default: return `${rank}th`
        }
    }

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
            <PageHeader
                title="狙い台分析"
                subtitle="指定期間の差枚データから、最も凹んでいる（狙い目）台を抽出します"
                startAdornment={<Crosshair size={20} />}
            />

            {/* コントロールパネル */}
            <section className="card-static p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                <Calendar size={12} /> 開始日
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-modern tabular-nums"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                <Calendar size={12} /> 終了日
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-modern tabular-nums"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isPending}
                        className="btn-primary flex items-center justify-center gap-2 h-[42px] px-8 w-full md:w-auto"
                    >
                        {isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        ) : (
                            <Search size={16} />
                        )}
                        <span>集計実行</span>
                    </button>

                </div>
            </section>

            {/* 結果表示 */}
            <div className="space-y-4">
                {hasSearched && results.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        データが見つかりませんでした
                    </div>
                )}

                {results.map((machine) => (
                    <section key={machine.machineId} className="card-static p-0 overflow-hidden border border-white/5 bg-slate-900/20">
                        <div className="px-5 py-3 border-b border-white/5 bg-slate-900/50">
                            <h2 className="text-base font-bold flex items-center gap-2">
                                <div className="w-1 h-4 bg-[var(--accent)] rounded-full"></div>
                                {machine.machineName}
                            </h2>
                        </div>

                        <div className="p-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {machine.rankings.map((rank) => (
                                    <Link
                                        key={rank.machineNo}
                                        href={`/history/${machine.machineId}/${rank.machineNo}`}
                                        className="relative flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors block"
                                    >
                                        {/* Rank Badge */}
                                        <div className={`flex-none w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm italic border ${getRankColor(rank.rank)} shadow-lg`}>
                                            {getRankLabel(rank.rank)}
                                        </div>

                                        {/* Machine Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-2xl font-bold tabular-nums tracking-tight leading-none">
                                                    {rank.machineNo}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-muted)]">番台</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[var(--text-muted)]">G数:</span>
                                                    <span className="tabular-nums font-medium text-[var(--text-secondary)]">
                                                        {rank.totalGames.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[var(--text-muted)]">日数:</span>
                                                    <span className="tabular-nums font-medium text-[var(--text-secondary)]">
                                                        {rank.days}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Diff Value */}
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-[10px] text-[var(--text-secondary)] mb-0.5">
                                                <TrendingDown size={12} className={rank.totalDiff < 0 ? "text-sky-400" : "text-[var(--text-muted)]"} />
                                                <span>期間差枚</span>
                                            </div>
                                            <div className={`text-lg font-bold tabular-nums tracking-tight ${rank.totalDiff > 0 ? 'text-plus' : rank.totalDiff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                {rank.totalDiff > 0 ? '+' : ''}{rank.totalDiff.toLocaleString()}
                                            </div>
                                        </div>
                                    </Link>
                                ))}

                                {/* Placeholder for missing data */}
                                {[...Array(3 - machine.rankings.length)].map((_, i) => (
                                    <div key={`empty-${i}`} className="p-3 rounded-lg border border-dashed border-white/5 bg-white/5 flex items-center justify-center h-[74px]">
                                        <span className="text-[10px] text-[var(--text-muted)] opacity-50">No Data</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
