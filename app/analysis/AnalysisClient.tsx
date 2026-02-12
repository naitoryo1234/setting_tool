'use client'

import { useState, useTransition, useEffect } from 'react'
import { getAnalysis, getMachines, toggleEventDay, AnalysisResult } from '@/lib/actions'

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
            className={`cursor-pointer select-none hover:text-[var(--accent)] transition-colors`}
            style={{ textAlign: align as any }}
            onClick={() => handleSort(field)}
        >
            <div className={`flex items-center ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} gap-1`}>
                {label}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {sortKey === field ? (sortAsc ? '▲' : '▼') : '⇅'}
                </span>
            </div>
        </th>
    )

    const PayoutBadge = ({ rate }: { rate: number }) => {
        let color = 'var(--text-muted)'
        let glow = 'none'
        if (rate >= 106) { color = '#f43f5e'; glow = '0 0 8px rgba(244,63,94,0.3)' }
        else if (rate >= 100) { color = '#4ade80'; glow = '0 0 8px rgba(74,222,128,0.2)' }
        else if (rate >= 97) { color = '#fbbf24' }
        else { color = '#38bdf8' }
        return <span style={{ fontWeight: 700, color, textShadow: glow }}>{rate.toFixed(1)}%</span>
    }

    return (
        <div className="animate-fade-in">
            {/* ページヘッダー */}
            <div className="page-header">
                <h1 className="page-header-title">🔍 深掘り分析</h1>
                <p className="page-header-subtitle">台番・曜日・イベント日別の傾向を探る</p>
            </div>

            <div className="space-y-6">
                {/* 検索条件 */}
                <div className="card-static stagger-item">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>店舗</label>
                            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="select-modern w-full">
                                {stores.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>機種</label>
                            <select value={machineId} onChange={(e) => setMachineId(e.target.value)} className="select-modern w-full">
                                <option value="">選択してください</option>
                                {machines.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1 h-6">
                                <input type="checkbox" id="useRange" checked={useRange} onChange={(e) => setUseRange(e.target.checked)}
                                    className="w-4 h-4 rounded"
                                    style={{ accentColor: 'var(--accent)' }}
                                />
                                <label htmlFor="useRange" className="text-sm cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>期間指定</label>
                            </div>
                            {useRange && (
                                <div className="flex gap-2">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-modern" />
                                    <span className="self-center" style={{ color: 'var(--text-muted)' }}>～</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-modern" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-[140px]">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>日種別</label>
                            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value as any)} className="select-modern w-full">
                                <option value="all">全日</option>
                                <option value="event">イベント日のみ</option>
                                <option value="normal">通常日のみ</option>
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <button onClick={handleSearch} disabled={!machineId || isPending} className="btn-primary w-full sm:w-auto px-6">
                                {isPending ? '⏳ 分析中...' : '🔍 分析'}
                            </button>
                        </div>
                    </div>
                    {!useRange && (
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>※ 期間未指定の場合、データが存在する全期間が対象</p>
                    )}
                </div>

                {/* イベント日登録 */}
                <div className="card-static stagger-item">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        📅 イベント日登録
                        <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                            ({stores.find(s => s.id === storeId)?.name || '店舗未選択'})
                        </span>
                    </h3>
                    <div className="flex gap-3 items-center flex-wrap">
                        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-modern w-40" />
                        <button
                            onClick={handleToggleEvent}
                            disabled={!eventDate || !storeId || isPending}
                            className="btn-primary"
                            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                        >
                            登録/解除
                        </button>
                        {eventMsg && <span className="text-sm animate-success" style={{ color: '#4ade80' }}>{eventMsg}</span>}
                    </div>
                </div>

                {/* スケルトンローディング */}
                {isPending && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="card-static" style={{ padding: '1.5rem' }}>
                                    <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '0.75rem' }} />
                                    <div className="skeleton" style={{ height: '28px', width: '70%' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 結果 */}
                {hasSearched && !isPending && result && (
                    <>
                        {/* 全体サマリー */}
                        <div className="card-static stagger-item">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {result.machineName}
                                </span>
                                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                                    ({result.overall.days}日間 / イベント日: {result.eventDayCount}日)
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { label: '総回転数', value: result.overall.totalGames.toLocaleString(), color: 'var(--text-primary)' },
                                    { label: '合計差枚', value: `${result.overall.totalDiff > 0 ? '+' : ''}${result.overall.totalDiff.toLocaleString()}`, color: result.overall.totalDiff > 0 ? 'var(--color-plus)' : 'var(--color-minus)' },
                                    { label: 'BIG回数', value: result.overall.totalBig.toString(), sub: `1/${result.overall.bigProb}`, color: '#f43f5e' },
                                    { label: 'REG回数', value: result.overall.totalReg.toString(), sub: `1/${result.overall.regProb}`, color: '#38bdf8' },
                                    { label: '推定出玉率', value: `${result.overall.payoutRate.toFixed(1)}%`, color: result.overall.payoutRate >= 100 ? '#4ade80' : '#fbbf24' },
                                ].map((stat, i) => (
                                    <div key={i} style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '1rem',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                                        <div className="stat-value glow-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                        {(stat as any).sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{(stat as any).sub}</div>}
                                    </div>
                                ))}
                            </div>
                            <div style={{
                                marginTop: '1rem',
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(234, 179, 8, 0.15)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '1rem',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>合算確率 (BIG+REG)</div>
                                <div className="stat-value glow-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24' }}>
                                    1/{result.overall.hitProb}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    ({result.overall.totalHits}回 / {result.overall.totalGames.toLocaleString()}G)
                                </div>
                            </div>
                        </div>

                        {/* タブ */}
                        <div className="card-static stagger-item" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15, 23, 42, 0.5)' }}>
                                {[
                                    { id: 'machine' as TabType, label: '📊 台番別' },
                                    { id: 'dow' as TabType, label: '📅 曜日別' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            padding: '1rem 2rem',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                            transition: 'all 0.25s ease',
                                            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                                            color: activeTab === tab.id ? '#a78bfa' : 'var(--text-muted)',
                                            background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                        }}
                                    >
                                        {tab.label}
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
                                                    <tr key={r.machineNo}>
                                                        <td style={{ fontWeight: 700 }}>
                                                            <a href={`/history/${result.machineId}/${r.machineNo}`} style={{ color: '#a78bfa', textDecoration: 'none' }}>
                                                                {r.machineNo}
                                                            </a>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>{r.days}</td>
                                                        <td style={{ textAlign: 'right' }}>{r.totalGames.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right', color: '#f43f5e' }}>{r.totalBig}</td>
                                                        <td style={{ textAlign: 'right', color: '#38bdf8' }}>{r.totalReg}</td>
                                                        <td style={{ textAlign: 'right' }}>{r.totalHits}</td>
                                                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>1/{r.bigProb}</td>
                                                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>1/{r.regProb}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>1/{r.hitProb}</td>
                                                        <td style={{ textAlign: 'right' }}><PayoutBadge rate={r.payoutRate} /></td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700 }} className={r.totalDiff > 0 ? 'text-plus' : r.totalDiff < 0 ? 'text-minus' : 'text-zero'}>
                                                            {r.totalDiff > 0 ? '+' : ''}{r.totalDiff.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ fontWeight: 700, background: 'rgba(15, 23, 42, 0.5)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <td style={{ padding: '0.75rem' }}>全体</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem' }}>{result.overall.days}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem' }}>{result.overall.totalGames.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem', color: '#f43f5e' }}>{result.overall.totalBig}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem', color: '#38bdf8' }}>{result.overall.totalReg}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem' }}>{result.overall.totalHits}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)' }}>1/{result.overall.bigProb}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)' }}>1/{result.overall.regProb}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem' }}>1/{result.overall.hitProb}</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem' }}><PayoutBadge rate={result.overall.payoutRate} /></td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem' }} className={result.overall.totalDiff > 0 ? 'text-plus' : 'text-minus'}>
                                                        {result.overall.totalDiff > 0 ? '+' : ''}{result.overall.totalDiff.toLocaleString()}
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
                                                    <th>曜日</th>
                                                    <th style={{ textAlign: 'right' }}>日数</th>
                                                    <th style={{ textAlign: 'right' }}>総G数</th>
                                                    <th style={{ textAlign: 'right' }}>BIG</th>
                                                    <th style={{ textAlign: 'right' }}>REG</th>
                                                    <th style={{ textAlign: 'right' }}>合算</th>
                                                    <th style={{ textAlign: 'right' }}>合算確率</th>
                                                    <th style={{ textAlign: 'right' }}>出玉率</th>
                                                    <th style={{ textAlign: 'right' }}>差枚</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.dowSummary.map((d) => (
                                                    <tr key={d.dow}>
                                                        <td style={{ fontWeight: 700, color: d.dow === 0 ? '#f43f5e' : d.dow === 6 ? '#38bdf8' : 'var(--text-primary)' }}>
                                                            {d.dowLabel}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>{d.days}</td>
                                                        <td style={{ textAlign: 'right' }}>{d.totalGames.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right', color: '#f43f5e' }}>{d.totalBig}</td>
                                                        <td style={{ textAlign: 'right', color: '#38bdf8' }}>{d.totalReg}</td>
                                                        <td style={{ textAlign: 'right' }}>{d.totalHits}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>1/{d.hitProb}</td>
                                                        <td style={{ textAlign: 'right' }}><PayoutBadge rate={d.payoutRate} /></td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700 }} className={d.totalDiff > 0 ? 'text-plus' : d.totalDiff < 0 ? 'text-minus' : 'text-zero'}>
                                                            {d.totalDiff > 0 ? '+' : ''}{d.totalDiff.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {result.dowSummary.length === 0 && (
                                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
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
                    <div className="card-static" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>🔍</div>
                        <div style={{ color: 'var(--text-muted)' }}>データが見つかりませんでした</div>
                    </div>
                )}

                {!hasSearched && !isPending && (
                    <div className="card-static stagger-item" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))' }}>🔍</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            分析を始めましょう
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            機種を選んで「分析」ボタンを押してください
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
