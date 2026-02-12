'use client'

import { useState, useTransition } from 'react'
import { getSummary, MachineSummary, MachineNoSummary } from '@/lib/actions'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

type Props = {
    machines: { id: string; name: string }[]
}

// 差枚数の表示テキスト
function formatDiff(diff: number): string {
    if (diff > 0) return `+${diff.toLocaleString()}`
    return diff.toLocaleString()
}

export default function SummaryClient({ machines }: Props) {
    const now = new Date()
    const offset = 9 * 60 * 60 * 1000
    const jstNow = new Date(now.getTime() + offset)
    const todayStr = jstNow.toISOString().split('T')[0]
    const weekAgo = new Date(jstNow.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    const [startDate, setStartDate] = useState(weekAgoStr)
    const [endDate, setEndDate] = useState(todayStr)
    const [machineSummary, setMachineSummary] = useState<MachineSummary[]>([])
    const [machineNoSummary, setMachineNoSummary] = useState<MachineNoSummary[]>([])
    const [selectedMachineId, setSelectedMachineId] = useState('')
    const [isPending, startTransition] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)
    const [sortKey, setSortKey] = useState<'totalDiff' | 'machineNo' | 'totalBig' | 'totalReg' | 'avgDiff'>('totalDiff')
    const [sortAsc, setSortAsc] = useState(true)

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
            setSortAsc(key === 'totalDiff')
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

    // チャート用データ（台番別差枚）
    const chartData = sortedMachineNo.map(m => ({
        name: `${m.machineNo}`,
        diff: m.totalDiff,
        machineName: m.machineName,
    })).sort((a, b) => b.diff - a.diff)

    // 差枚バー最大値
    const maxAbsDiff = Math.max(...sortedMachineNo.map(m => Math.abs(m.totalDiff)), 1)

    return (
        <div className="animate-fade-in">
            {/* ページヘッダー */}
            <div className="page-header">
                <h1 className="page-header-title">📊 集計ダッシュボード</h1>
                <p className="page-header-subtitle">期間別のパフォーマンスを分析</p>
            </div>

            <div className="space-y-6">
                {/* 検索バー */}
                <div className="card-static stagger-item">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <div className="flex-1 min-w-0" style={{ maxWidth: '160px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.375rem', fontWeight: 500 }}>
                                開始日
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-modern"
                            />
                        </div>
                        <div className="flex-1 min-w-0" style={{ maxWidth: '160px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.375rem', fontWeight: 500 }}>
                                終了日
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-modern"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isPending}
                            className="btn-primary sm:w-auto"
                            style={{ minWidth: '100px' }}
                        >
                            {isPending ? '⏳ 集計中...' : '📊 集計'}
                        </button>
                    </div>
                </div>

                {/* ローディングスケルトン */}
                {isPending && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="card-static" style={{ padding: '1.5rem' }}>
                                    <div className="skeleton" style={{ height: '12px', width: '60%', marginBottom: '0.75rem' }} />
                                    <div className="skeleton" style={{ height: '24px', width: '80%' }} />
                                </div>
                            ))}
                        </div>
                        <div className="card-static" style={{ padding: '2rem' }}>
                            <div className="skeleton" style={{ height: '200px', width: '100%' }} />
                        </div>
                    </div>
                )}

                {hasSearched && !isPending && (
                    <>
                        {/* 機種サマリーカード */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {machineSummary.map((m, i) => (
                                <button
                                    key={m.machineId}
                                    onClick={() => setSelectedMachineId(selectedMachineId === m.machineId ? '' : m.machineId)}
                                    className="card text-left stagger-item"
                                    style={{
                                        cursor: 'pointer',
                                        borderColor: selectedMachineId === m.machineId ? 'rgba(99, 102, 241, 0.5)' : undefined,
                                        boxShadow: selectedMachineId === m.machineId ? '0 0 0 1px rgba(99, 102, 241, 0.4), 0 4px 20px rgba(99, 102, 241, 0.15)' : undefined,
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        {m.machineName}
                                    </div>
                                    <div
                                        className={`stat-value glow-value ${m.totalDiff > 0 ? 'diff-plus' : m.totalDiff < 0 ? 'diff-minus' : 'diff-zero'}`}
                                        style={{ fontSize: '1.25rem' }}
                                    >
                                        {formatDiff(m.totalDiff)}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                        {m.count}件
                                        {hasDetails && ` · B${m.totalBig} R${m.totalReg}`}
                                    </div>
                                </button>
                            ))}
                            {/* 合計カード */}
                            <button
                                onClick={() => setSelectedMachineId('')}
                                className="card text-left stagger-item"
                                style={{
                                    cursor: 'pointer',
                                    borderColor: selectedMachineId === '' ? 'rgba(34, 211, 238, 0.4)' : undefined,
                                    boxShadow: selectedMachineId === '' ? '0 0 0 1px rgba(34, 211, 238, 0.3), 0 4px 20px rgba(34, 211, 238, 0.1)' : undefined,
                                }}
                            >
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    全機種合計
                                </div>
                                <div
                                    className={`stat-value glow-value ${grandTotal > 0 ? 'diff-plus' : grandTotal < 0 ? 'diff-minus' : 'diff-zero'}`}
                                    style={{ fontSize: '1.25rem' }}
                                >
                                    {formatDiff(grandTotal)}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    {machineSummary.reduce((a, b) => a + b.count, 0)}件
                                </div>
                            </button>
                        </div>

                        {/* 差枚チャート */}
                        {chartData.length > 0 && (
                            <div className="card-static stagger-item" style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                    📈 台番別 差枚グラフ
                                </h3>
                                <div style={{ width: '100%', height: Math.max(chartData.length * 32, 200) }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" horizontal={false} />
                                            <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                                            <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={40} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'rgba(15, 23, 42, 0.95)',
                                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                                    borderRadius: '10px',
                                                    backdropFilter: 'blur(12px)',
                                                    color: '#f1f5f9',
                                                    fontSize: '0.8rem',
                                                }}
                                                formatter={(value: any) => [formatDiff(Number(value)), '差枚']}
                                                labelFormatter={(label) => {
                                                    const item = chartData.find(d => d.name === label)
                                                    return `No.${label} (${item?.machineName || ''})`
                                                }}
                                            />
                                            <Bar dataKey="diff" radius={[0, 4, 4, 0]} barSize={20}>
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.diff > 0 ? '#f43f5e' : '#38bdf8'}
                                                        fillOpacity={0.8}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* 台別テーブル */}
                        <div className="card-static stagger-item" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{
                                padding: '1rem 1.25rem 0.75rem',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(15, 23, 42, 0.5)',
                            }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                                            🏆 台別ランキング
                                        </h2>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                                            {startDate.replace(/-/g, '/')} 〜 {endDate.replace(/-/g, '/')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedMachineId}
                                            onChange={(e) => setSelectedMachineId(e.target.value)}
                                            className="select-modern"
                                            style={{ width: 'auto', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                                        >
                                            <option value="">全機種</option>
                                            {machines.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table-jat">
                                    <thead>
                                        <tr>
                                            <th className="cursor-pointer select-none" onClick={() => handleSort('machineNo')} style={{ minWidth: '3rem', padding: '0.5rem 0.25rem' }}>
                                                台番 {sortKey === 'machineNo' ? (sortAsc ? '▲' : '▼') : '⇅'}
                                            </th>
                                            {hasDetails && (
                                                <>
                                                    <th className="cursor-pointer select-none" style={{ textAlign: 'center', minWidth: '2.5rem', padding: '0.5rem 0.1rem' }} onClick={() => handleSort('totalBig')}>
                                                        B {sortKey === 'totalBig' ? (sortAsc ? '▲' : '▼') : '⇅'}
                                                    </th>
                                                    <th className="cursor-pointer select-none" style={{ textAlign: 'center', minWidth: '2.5rem', padding: '0.5rem 0.1rem' }} onClick={() => handleSort('totalReg')}>
                                                        R {sortKey === 'totalReg' ? (sortAsc ? '▲' : '▼') : '⇅'}
                                                    </th>
                                                    <th style={{ textAlign: 'center', minWidth: '3.5rem', padding: '0.5rem 0.1rem' }}>G数</th>
                                                </>
                                            )}
                                            <th className="cursor-pointer select-none" style={{ textAlign: 'center', minWidth: '5rem', padding: '0.5rem 0.25rem' }} onClick={() => handleSort('totalDiff')}>
                                                差枚 {sortKey === 'totalDiff' ? (sortAsc ? '▲' : '▼') : '⇅'}
                                            </th>
                                            <th style={{ minWidth: '4rem', padding: '0.5rem 0.25rem' }}>グラフ</th>
                                            {!selectedMachineId && <th style={{ minWidth: '4rem', padding: '0.5rem 0.25rem' }}>機種</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedMachineNo.map((m) => (
                                            <tr key={`${m.machineId}-${m.machineNo}`}>
                                                <td style={{ textAlign: 'center', padding: '0.5rem 0.25rem' }}>
                                                    <a
                                                        href={`/history/${m.machineId}/${m.machineNo}`}
                                                        style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}
                                                    >
                                                        {m.machineNo}
                                                    </a>
                                                </td>
                                                {hasDetails && (
                                                    <>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem 0.1rem' }}>
                                                            {m.totalBig || '-'}
                                                        </td>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem 0.1rem' }}>
                                                            {m.totalReg || '-'}
                                                        </td>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem 0.1rem' }}>
                                                            {m.totalGames ? m.totalGames.toLocaleString() : '-'}
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ textAlign: 'center', padding: '0.5rem 0.25rem' }}>
                                                    <span className={m.totalDiff > 0 ? 'text-plus' : m.totalDiff < 0 ? 'text-minus' : 'text-zero'}>
                                                        {formatDiff(m.totalDiff)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.5rem 0.25rem', minWidth: '80px' }}>
                                                    <div className="diff-bar-container">
                                                        <div
                                                            className={`diff-bar ${m.totalDiff >= 0 ? 'diff-bar-plus' : 'diff-bar-minus'}`}
                                                            style={{ width: `${(Math.abs(m.totalDiff) / maxAbsDiff) * 100}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                {!selectedMachineId && (
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '0.5rem 0.25rem', whiteSpace: 'normal', minWidth: '60px' }}>
                                                        {m.machineName}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {sortedMachineNo.length === 0 && (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                                    データがありません
                                </div>
                            )}
                        </div>
                    </>
                )}

                {!hasSearched && !isPending && (
                    <div className="card-static stagger-item" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))' }}>📊</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            集計を始めましょう
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            期間を指定して「集計」ボタンを押してください
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
