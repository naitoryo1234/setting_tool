import Link from 'next/link'
import { PenLine, BarChart2, List, Crosshair, MonitorPlay, LayoutGrid } from 'lucide-react'
import { getMachines } from '@/lib/actions'

const menuItems = [
  { href: '/machines', label: '機種データ', description: '機種ごとの稼働データ閲覧', Icon: LayoutGrid, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
  { href: '/input', label: '入力', description: '日々の稼働データを記録', Icon: PenLine, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
  { href: '/analysis', label: '分析', description: '台番別・曜日別の分析', Icon: BarChart2, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
  { href: '/targets', label: '狙い台', description: '凹み台・狙い目の抽出', Icon: Crosshair, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
  { href: '/records', label: '記録', description: 'データの編集・管理', Icon: List, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
]

export const dynamic = 'force-dynamic'

export default async function Home() {
  const machines = await getMachines()

  return (
    <div className="animate-fade-in pb-12">
      {/* Hero Section */}
      <div className="relative w-full h-[320px] md:h-[400px] mb-12 flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/fintech-bg.png')` }}
        />
        {/* Multi-directional fade to blend seamlessly */}
        <div className="absolute inset-0 z-0" style={{
          background: `
            radial-gradient(ellipse 80% 70% at 50% 45%, transparent 30%, var(--bg-primary) 100%),
            linear-gradient(to bottom, var(--bg-primary) 0%, transparent 15%, transparent 70%, var(--bg-primary) 100%)
          `
        }} />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 pt-8">
          <div className="inline-flex flex-col items-center mb-6">
            <div className="text-6xl md:text-7xl font-black tracking-widest text-[var(--text-primary)] drop-shadow-md mb-1"
              style={{ fontFamily: 'serif', letterSpacing: '0.15em' }}>
              設鑑
            </div>
            <div className="text-xs tracking-[0.5em] text-[var(--primary)] font-medium uppercase border-t border-b border-[var(--primary)]/40 px-4 py-1">
              SEKKAN
            </div>
          </div>
          <p className="text-sm md:text-base font-medium text-[var(--text-secondary)] tracking-wider">
            パチスロ稼働データ蓄積・設定分析ツール
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mb-16">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] hover:bg-[var(--bg-card-solid)] transition-all duration-300 shadow-sm"
            >
              <div className={`p-4 rounded-full mb-4 ${item.color} ${item.bg} group-hover:scale-110 transition-transform`}>
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
          <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-2">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-secondary)]">
              <MonitorPlay size={20} className="text-[var(--primary)]" />
              機種別クイックアクセス
            </h2>
            <Link href="/machines" className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors">
              すべて見る →
            </Link>
          </div>

          {machines.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {machines.map((machine) => (
                <Link
                  key={machine.id}
                  href={`/history/${machine.id}`}
                  className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all group flex items-center justify-between"
                >
                  <span className="font-bold text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                    {machine.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-2 shrink-0">
                    {machine.numbers.length}台
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[var(--text-muted)] bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-color)]">
              登録されている機種がありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
