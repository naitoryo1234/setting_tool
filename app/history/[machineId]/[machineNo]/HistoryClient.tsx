'use client'

import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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
        <div className="animate-fade-in">
            {/* ページヘッダー */}
            <div className="page-header">
                <div className="flex items-center gap-4 flex-wrap">
                    <Link
                        href="/summary"
                        className="transition-all"
                        style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            color: '#a78bfa',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        ← 集計に戻る
                    </Link>
                    <div>
                        <h1 className="page-header-title" style={{ fontSize: '1.25rem' }}>
                            📜 {machineName} - No.{machineNo}
                        </h1>
                        <p className="page-header-subtitle">台番別の履歴データ</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* サマリーカード */}
                <div className="grid grid-cols-3 gap-4 stagger-item">
                    <div className="card-static text-center">
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            データ件数
                        </div>
                        <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {records.length}
                        </div>
                    </div>
                    <div className="card-static text-center">
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            合計差枚
                        </div>
                        <div
                            className={`stat-value glow-value ${totalDiff > 0 ? 'diff-plus' : totalDiff < 0 ? 'diff-minus' : 'diff-zero'}`}
                            style={{ fontSize: '1.75rem', fontWeight: 800 }}
                        >
                            {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}
                        </div>
                    </div>
                    <div className="card-static text-center">
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            平均差枚
                        </div>
                        <div
                            className={`stat-value glow-value ${avgDiff > 0 ? 'diff-plus' : avgDiff < 0 ? 'diff-minus' : 'diff-zero'}`}
                            style={{ fontSize: '1.75rem', fontWeight: 800 }}
                        >
                            {avgDiff > 0 ? '+' : ''}{avgDiff.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* 累積差枚グラフ */}
                {chartData.length > 1 && (
                    <div className="card-static stagger-item" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            📈 差枚推移
                        </h3>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                            borderRadius: '10px',
                                            backdropFilter: 'blur(12px)',
                                            color: '#f1f5f9',
                                            fontSize: '0.8rem',
                                        }}
                                        formatter={(value: any, name: any) => {
                                            const v = Number(value)
                                            const label = name === 'cumulative' ? '累積差枚' : '当日差枚'
                                            return [`${v > 0 ? '+' : ''}${v.toLocaleString()}`, label]
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cumulative"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCumulative)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* 履歴テーブル */}
                <div className="card-static stagger-item" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="overflow-x-auto">
                        <table className="table-jat w-full text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3">日付</th>
                                    <th className="px-4 py-3 text-right">差枚</th>
                                    <th className="px-4 py-3 text-right">BIG</th>
                                    <th className="px-4 py-3 text-right">REG</th>
                                    <th className="px-4 py-3 text-right">G数</th>
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
                                        <tr key={r.id}>
                                            <td className="px-4 py-3">{dateStr}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${r.diff > 0 ? 'text-plus' : r.diff < 0 ? 'text-minus' : 'text-zero'}`}>
                                                {r.diff > 0 ? '+' : ''}{r.diff.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right" style={{ color: '#f43f5e' }}>{r.big ?? '-'}</td>
                                            <td className="px-4 py-3 text-right" style={{ color: '#38bdf8' }}>{r.reg ?? '-'}</td>
                                            <td className="px-4 py-3 text-right">{r.games?.toLocaleString() ?? '-'}</td>
                                        </tr>
                                    )
                                })}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
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
