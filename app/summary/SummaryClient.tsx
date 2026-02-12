'use client'

import { useState, useTransition } from 'react'
import { getSummary, MachineSummary, MachineNoSummary } from '@/lib/actions'

type Props = {
    machines: { id: string; name: string }[]
}

// 差枚数の表示テキスト
function formatDiff(diff: number): string {
    if (diff > 0) return `+${diff.toLocaleString()}`
    return diff.toLocaleString()
}

// 差枚バーの幅（最大値に対する割合）
function barWidth(diff: number, maxAbs: number): number {
    if (maxAbs === 0) return 0
    return Math.min(Math.abs(diff) / maxAbs * 100, 100)
}

// ランクバッジ
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <span className="badge badge-rank-1">🥇 1st</span>
    if (rank === 2) return <span className="badge badge-rank-2">🥈 2nd</span>
    if (rank === 3) return <span className="badge badge-rank-3">🥉 3rd</span>
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>{rank}</span>
}

export default function SummaryClient({ machines }: Props) {
    const now = new Date()
    const offset = 9 * 60 * 60 * 1000
    const jstNow = new Date(now.getTime() + offset)
    const todayStr = jstNow.toISOString().split('T')[0]
    // デフォルト: 1週間前〜今日
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
            setSortAsc(key === 'totalDiff') // 差枚はデフォ昇順、それ以外は降順
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
        <div className="space-y-6 animate-fade-in">
            {/* 検索バー */}
            <div className="card-static">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end p-2">
                    <div className="sm:w-auto sm:flex-1 min-w-0" style={{ width: '100%', maxWidth: '140px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
                            開始日
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-modern"
                        />
                    </div>
                    <div className="sm:w-auto sm:flex-1 min-w-0" style={{ width: '100%', maxWidth: '140px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
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
                        style={{ width: '100%', maxWidth: '140px' }}
                    >
                        {isPending ? '集計中...' : '集計'}
                    </button>
                </div>
            </div>

            {hasSearched && (
                <>
                    {/* 機種サマリーカード */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {machineSummary.map((m) => (
                            <button
                                key={m.machineId}
                                onClick={() => setSelectedMachineId(selectedMachineId === m.machineId ? '' : m.machineId)}
                                className="card text-left"
                                style={{
                                    cursor: 'pointer',
                                    borderColor: selectedMachineId === m.machineId ? 'var(--accent)' : undefined,
                                    boxShadow: selectedMachineId === m.machineId ? '0 0 0 1px var(--accent), 0 4px 20px var(--accent-glow)' : undefined,
                                }}
                            >
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    {m.machineName}
                                </div>
                                <div className={m.totalDiff > 0 ? 'diff-plus' : m.totalDiff < 0 ? 'diff-minus' : 'diff-zero'} style={{ fontSize: '1.125rem' }}>
                                    {formatDiff(m.totalDiff)}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    {m.count}件
                                    {hasDetails && ` · B${m.totalBig} R${m.totalReg}`}
                                </div>
                            </button>
                        ))}
                        {/* 合計カード */}
                        <button
                            onClick={() => setSelectedMachineId('')}
                            className="card text-left"
                            style={{
                                cursor: 'pointer',
                                borderColor: selectedMachineId === '' ? 'var(--accent)' : undefined,
                                boxShadow: selectedMachineId === '' ? '0 0 0 1px var(--accent), 0 4px 20px var(--accent-glow)' : undefined,
                            }}
                        >
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                全機種合計
                            </div>
                            <div className={grandTotal > 0 ? 'diff-plus' : grandTotal < 0 ? 'diff-minus' : 'diff-zero'} style={{ fontSize: '1.125rem' }}>
                                {formatDiff(grandTotal)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {machineSummary.reduce((a, b) => a + b.count, 0)}件
                            </div>
                        </button>
                    </div>

                    {/* 台別テーブル */}
                    <div className="card-static" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                                        台別ランキング
                                    </h2>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1, marginTop: '2px' }}>
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
                                        <th className="sortable" onClick={() => handleSort('machineNo')} style={{ minWidth: '3rem', padding: '0.5rem 0.25rem' }}>
                                            台番 {sortKey === 'machineNo' ? (sortAsc ? '↑' : '↓') : ''}
                                        </th>
                                        {hasDetails && (
                                            <>
                                                <th className="sortable" style={{ textAlign: 'center', minWidth: '2.5rem', padding: '0.5rem 0.1rem' }} onClick={() => handleSort('totalBig')}>
                                                    B {sortKey === 'totalBig' ? (sortAsc ? '↑' : '↓') : ''}
                                                </th>
                                                <th className="sortable" style={{ textAlign: 'center', minWidth: '2.5rem', padding: '0.5rem 0.1rem' }} onClick={() => handleSort('totalReg')}>
                                                    R {sortKey === 'totalReg' ? (sortAsc ? '↑' : '↓') : ''}
                                                </th>
                                                <th style={{ textAlign: 'center', minWidth: '3.5rem', padding: '0.5rem 0.1rem' }}>G数</th>
                                            </>
                                        )}
                                        <th className="sortable" style={{ textAlign: 'center', minWidth: '4.5rem', padding: '0.5rem 0.25rem' }} onClick={() => handleSort('totalDiff')}>
                                            差枚
                                        </th>
                                        {!selectedMachineId && <th style={{ minWidth: '4rem', padding: '0.5rem 0.25rem' }}>機種</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedMachineNo.map((m, i) => {
                                        const rank = i + 1
                                        return (
                                            <tr key={`${m.machineId}-${m.machineNo}`}>
                                                <td style={{ textAlign: 'center', padding: '0.5rem 0.25rem' }}>
                                                    <a
                                                        href={`/history/${m.machineId}/${m.machineNo}`}
                                                        style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}
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
                                                {!selectedMachineId && (
                                                    <td style={{ color: '#9ca3af', fontSize: '0.7rem', padding: '0.5rem 0.25rem', whiteSpace: 'normal', minWidth: '60px' }}>
                                                        {m.machineName}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {sortedMachineNo.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                データがありません
                            </div>
                        )}
                    </div>
                </>
            )}

            {!hasSearched && (
                <div className="card-static" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        期間を指定して「集計」を押してください
                    </div>
                </div>
            )}
        </div>
    )
}
