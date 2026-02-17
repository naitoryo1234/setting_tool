import Link from 'next/link'
import { PenLine, PieChart, BarChart2, List, Crosshair, MonitorPlay } from 'lucide-react'
import { getMachines } from '@/lib/actions'

const menuItems = [
  { href: '/input', label: '入力', description: '日々の稼働データを記録', Icon: PenLine, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { href: '/summary', label: '集計', description: '期間ごとの収支を確認', Icon: PieChart, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { href: '/analysis', label: '分析', description: '機種・日付・曜日の傾向', Icon: BarChart2, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { href: '/records', label: '記録', description: '全データの閲覧・管理', Icon: List, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { href: '/targets', label: '狙い台', description: '凹み台・狙い目の抽出', Icon: Crosshair, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
]

export const dynamic = 'force-dynamic'

export default async function Home() {
  const machines = await getMachines()

  return (
    <div className="container mx-auto py-12 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Setting Tool
        </h1>
        <p className="text-[var(--text-secondary)]">
          パチスロ設定・収支管理ツール
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mb-16">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex flex-col items-center justify-center p-6 rounded-xl border ${item.border} ${item.bg} hover:scale-105 transition-all duration-300 hover:shadow-lg hover:bg-opacity-20`}
          >
            <div className={`p-4 rounded-full bg-black/20 mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
              <item.Icon size={32} />
            </div>
            <h2 className="text-lg font-bold mb-1 text-[var(--text-primary)]">
              {item.label}
            </h2>
            <p className="text-xs text-[var(--text-muted)] text-center">
              {item.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Machine Links Section */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-secondary)] border-b border-white/5 pb-2">
          <MonitorPlay size={24} className="text-[var(--accent)]" />
          機種別データ一覧
        </h2>

        {machines.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {machines.map((machine) => (
              <Link
                key={machine.id}
                href={`/history/${machine.id}`}
                className="card-static p-4 hover:border-[var(--accent)] transition-all hover:bg-slate-900/60 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                    {machine.name}
                  </span>
                  <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                    {machine.numbers.length}台
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 group-hover:opacity-100 opacity-70 transition-opacity">
                  詳細データを見る →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-[var(--text-muted)] bg-slate-900/20 rounded-xl border border-dashed border-white/10">
            登録されている機種がありません
          </div>
        )}
      </div>
    </div>
  )
}
