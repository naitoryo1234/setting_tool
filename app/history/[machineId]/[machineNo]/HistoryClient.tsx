'use client'

import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts'
import { History, ArrowLeft, BarChart2, Calendar, Coins, TrendingUp, Inbox, Activity, Percent, Trophy, Timer, BrainCircuit } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { getMachineSpec, estimateSetting, EstimationResult } from '@/lib/analysis/settingEstimator'

type HistoryRecord = {
    id: string
    date: string | Date
    diff: number
    big?: number | null
    reg?: number | null
    games?: number | null
}

type Props = {
    machineName: string
    machineNo: number
    records: HistoryRecord[]
    machineId: string
}

export default function HistoryClient({ machineName, machineNo, records, machineId }: Props) {
    // Basic Stats
    const totalDiff = records.reduce((sum, r) => sum + r.diff, 0)
    const avgDiff = records.length > 0 ? Math.round(totalDiff / records.length) : 0

    // Detailed Stats
    const totalGames = records.reduce((sum, r) => sum + (r.games || 0), 0)
    const totalBig = records.reduce((sum, r) => sum + (r.big || 0), 0)
    const totalReg = records.reduce((sum, r) => sum + (r.reg || 0), 0)
    const totalHits = totalBig + totalReg

    const bigProb = totalGames > 0 && totalBig > 0 ? Math.round(totalGames / totalBig) : 0
    const regProb = totalGames > 0 && totalReg > 0 ? Math.round(totalGames / totalReg) : 0
    const compositeProb = totalGames > 0 && totalHits > 0 ? Math.round(totalGames / totalHits) : 0

    const winDays = records.filter(r => r.diff > 0).length
    const winRate = records.length > 0 ? Math.round((winDays / records.length) * 1000) / 10 : 0

    const inCoins = totalGames * 3
    const outCoins = inCoins + totalDiff
    const payoutRate = inCoins > 0 ? Math.round((outCoins / inCoins) * 1000) / 10 : 0

    // Setting Estimation
    // Force re-evaluation by log
    // console.log('MachineName:', machineName)
    const spec = getMachineSpec(machineName)
    let estimationResults: EstimationResult[] = []

    if (spec) {
        // Hokuto Tensei: Use REG count for estimation as per user instruction (REG = AT Initial Hit)
        // Also use totalGames which is correct.
        const targetCount = machineName.includes('北斗') ? totalReg : totalHits // Default to Hit if not Hokuto? Or maybe REG too?
        // Actually, for consistency with the user request "AT Initial Hit = RB", we use REG.
        // For other machines, we might need different logic, but for now focusing on Hokuto.
        if (totalGames > 0) {
            estimationResults = estimateSetting(totalGames, targetCount ?? 0, spec)
        }
    }

    // Chart Data
    const sortedRecords = [...records].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let cumulative = 0
    const chartData = sortedRecords.map(r => {
        cumulative += r.diff
        return {
            date: new Date(r.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
            diff: r.diff,
            cumulative,
        }
    })

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
            {/* Page Header */}
            <PageHeader
                title={
                    <span>
                        <Link href={`/history/${machineId}`} className="hover:text-[var(--accent)] transition-colors">
                            {machineName}
                        </Link>
                        <span className="text-muted-foreground text-lg font-normal ml-2">No.{machineNo}</span>
                    </span>
                }
                subtitle="台番別詳細データ・分析"
                startAdornment={<History size={20} />}
                backHref={`/history/${machineId}`}
            />

            <div className="space-y-6">
                {/* 統計カードグリッド */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-item">
                    {/* 1. 稼働実績 */}
                    <div className="card-static p-4 border border-white/5 bg-slate-900/40">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Timer size={12} /> 総ゲーム数
                        </div>
                        <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                            {totalGames.toLocaleString()} G
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                            {records.length} 稼働日
                        </div>
                    </div>

                    {/* 2. 収支実績 */}
                    <div className="card-static p-4 border border-white/5 bg-slate-900/40">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Coins size={12} /> 総差枚
                        </div>
                        <div className={`text-xl font-bold tabular-nums ${totalDiff > 0 ? 'diff-plus' : totalDiff < 0 ? 'diff-minus' : 'diff-zero'}`}>
                            {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                            平均 {avgDiff > 0 ? '+' : ''}{avgDiff.toLocaleString()} 枚
                        </div>
                    </div>

                    {/* 3. 確率実績 */}
                    <div className="card-static p-4 border border-white/5 bg-slate-900/40">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Activity size={12} /> ボーナス確率
                        </div>
                        <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs text-rose-400">BB</span>
                            <span className="font-bold tabular-nums">1/{bigProb || '-'}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs text-sky-400">RB (AT)</span>
                            <span className="font-bold tabular-nums">1/{regProb || '-'}</span>
                        </div>
                    </div>

                    {/* 4. 推定指標 */}
                    <div className="card-static p-4 border border-white/5 relative overflow-hidden">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Percent size={12} /> 推定機械割
                        </div>
                        <div className={`text-2xl font-bold tabular-nums ${payoutRate >= 100 ? 'text-rose-400' : 'text-blue-400'}`}>
                            {payoutRate}%
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                            勝率 {winRate}% ({winDays}/{records.length})
                        </div>
                    </div>
                </div>

                {/* 設定推測セクション (Available only if spec exists) */}
                {estimationResults.length > 0 && (
                    <div className="card-static stagger-item p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
                            <BrainCircuit size={16} className="text-emerald-400" />
                            設定推測 (Based on RB/AT Prob)
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={estimationResults}>
                                        <XAxis
                                            dataKey="setting"
                                            tickFormatter={(val) => `設定${val}`}
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{
                                                background: 'rgba(15, 23, 42, 0.9)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: '#f8fafc'
                                            }}
                                            formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '期待度']}
                                        />
                                        <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                                            {estimationResults.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        entry.setting >= 5
                                                            ? '#f43f5e' // Rose for 5-6
                                                            : entry.setting >= 3
                                                                ? '#38bdf8' // Blue/Sky for 3-4
                                                                : '#64748b' // Slate for 1-2
                                                    }
                                                    fillOpacity={0.8 + (entry.probability / 500)} // Slight opacity boost based on prob
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-48 flex flex-col justify-center space-y-2">
                                <div className="text-xs text-[var(--text-muted)] mb-2">高設定期待度 (設定4以上)</div>
                                <div className="text-3xl font-bold tabular-nums text-emerald-400">
                                    {(estimationResults.filter(r => r.setting >= 4).reduce((sum, r) => sum + r.probability, 0)).toFixed(1)}%
                                </div>
                                <div className="text-xs text-[var(--text-muted)] mt-4">
                                    設定6期待度: <span className="text-white font-bold ml-1">{estimationResults.find(r => r.setting === 6)?.probability.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 累積差枚グラフ */}
                {chartData.length > 1 && (
                    <div className="card-static stagger-item p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
                            <BarChart2 size={16} className="text-[var(--accent)]" />
                            差枚推移 (Slump Graph)
                        </h3>
                        {/* ... (Existing Graph Code) ... */}
                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickFormatter={(v) => v.toLocaleString()}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(15, 23, 42, 0.9)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px',
                                            color: '#f8fafc'
                                        }}
                                        itemStyle={{ padding: 0 }}
                                        labelStyle={{ marginBottom: '4px', color: '#94a3b8' }}
                                        formatter={(value: any, name: any) => {
                                            const v = Number(value)
                                            const label = name === 'cumulative' ? '累積差枚' : '当日差枚'
                                            return [`${v > 0 ? '+' : ''}${v.toLocaleString()}`, label]
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cumulative"
                                        stroke="#ec4899"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCumulative)"
                                        activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* 履歴テーブル */}
                <div className="card-static stagger-item p-0 overflow-hidden border border-white/5">
                    <div className="px-5 py-4 border-b border-white/5 bg-slate-900/50">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">詳細履歴</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table-jat w-full text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="pl-5 py-3 w-32">日付</th>
                                    <th className="py-3 text-right">差枚</th>
                                    <th className="py-3 text-right">BIG</th>
                                    <th className="py-3 text-right">REG</th>
                                    <th className="py-3 text-right pr-5">G数</th>
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
                                        <tr key={r.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="pl-5 py-3 tabular-nums text-[var(--text-secondary)]">{dateStr}</td>
                                            <td className={`py-3 text-right tabular-nums font-bold ${r.diff > 0 ? 'text-plus' : r.diff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                {r.diff > 0 ? '+' : ''}{r.diff.toLocaleString()}
                                            </td>
                                            <td className="py-3 text-right tabular-nums text-rose-400">{r.big ?? '-'}</td>
                                            <td className="py-3 text-right tabular-nums text-sky-400">{r.reg ?? '-'}</td>
                                            <td className="py-3 text-right pr-5 tabular-nums text-[var(--text-muted)]">{r.games?.toLocaleString() ?? '-'}</td>
                                        </tr>
                                    )
                                })}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-[var(--text-muted)]">
                                            <Inbox size={48} className="mx-auto mb-3 opacity-20" />
                                            データがありません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
