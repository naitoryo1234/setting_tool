'use client'

import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { History, ArrowLeft, BarChart2, Calendar, Coins, TrendingUp, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

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
    const totalDiff = records.reduce((sum, r) => sum + r.diff, 0)
    const avgDiff = records.length > 0 ? Math.round(totalDiff / records.length) : 0

    // チャート用データ（日付順にソート、累積差枚）
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
            {/* ページヘッダー */}
            {/* ページヘッダー */}
            <PageHeader
                title={
                    <span>
                        {machineName} <span className="text-muted-foreground text-lg font-normal">No.{machineNo}</span>
                    </span>
                }
                subtitle="台番別履歴データ・スランプグラフ"
                startAdornment={<History size={20} />}
                backHref="/summary"
            />

            <div className="space-y-6">
                {/* サマリーカード */}
                <div className="grid grid-cols-3 gap-4 stagger-item">
                    <div className="card-static text-center p-4 border border-white/5 bg-slate-900/40">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider flex justify-center items-center gap-1">
                            <Calendar size={12} /> データ件数
                        </div>
                        <div className="stat-value text-xl font-bold text-[var(--text-primary)] tabular-nums">
                            {records.length}
                        </div>
                    </div>
                    <div className="card-static text-center p-4 border border-white/5 bg-slate-900/40">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider flex justify-center items-center gap-1">
                            <Coins size={12} /> 合計差枚
                        </div>
                        <div
                            className={`stat-value glow-value text-xl font-bold tabular-nums ${totalDiff > 0 ? 'diff-plus' : totalDiff < 0 ? 'diff-minus' : 'diff-zero'}`}
                        >
                            {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}
                        </div>
                    </div>
                    <div className="card-static text-center p-4 border border-white/5 bg-slate-900/40">
                        <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider flex justify-center items-center gap-1">
                            <TrendingUp size={12} /> 平均差枚
                        </div>
                        <div
                            className={`stat-value glow-value text-xl font-bold tabular-nums ${avgDiff > 0 ? 'diff-plus' : avgDiff < 0 ? 'diff-minus' : 'diff-zero'}`}
                        >
                            {avgDiff > 0 ? '+' : ''}{avgDiff.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* 累積差枚グラフ */}
                {chartData.length > 1 && (
                    <div className="card-static stagger-item p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
                            <BarChart2 size={16} className="text-[var(--accent)]" />
                            差枚推移 (Slump Graph)
                        </h3>
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
