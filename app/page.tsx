import Link from 'next/link'
import { PenLine, BarChart2, List, Crosshair, MonitorPlay, LayoutGrid, ChevronRight } from 'lucide-react'
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

      {/* ===== モバイル: コンパクトヘッダー ===== */}
      <div className="md:hidden px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="text-3xl font-black text-[var(--text-primary)] tracking-widest"
            style={{ fontFamily: 'serif', letterSpacing: '0.1em' }}>
            設鑑
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] tracking-[0.4em] text-[var(--primary)] font-medium uppercase leading-none">SEKKAN</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">設定分析ツール</div>
          </div>
        </div>
      </div>

      {/* ===== モバイル: コンパクトメニューグリッド ===== */}
      <div className="md:hidden px-4 mb-6 space-y-3">
        {/* 最優先アクション (狙い台) */}
        {menuItems.filter(i => i.href === '/targets').map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--bg-card)] active:bg-[var(--bg-card-solid)] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <div className={`p-3 rounded-full ${item.color} ${item.bg}`}>
              <item.Icon size={28} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)] tracking-wide mb-0.5">
                {item.label}
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {item.description}
              </p>
            </div>
            <ChevronRight size={20} className="text-[var(--primary)] ml-auto opacity-70" />
          </Link>
        ))}

        {/* メインボード (2x2 グリッド) */}
        <div className="grid grid-cols-2 gap-2">
          {menuItems.filter(i => i.href !== '/targets').map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] active:bg-[var(--bg-card-solid)] active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-lg ${item.color} ${item.bg}`}>
                  <item.Icon size={18} strokeWidth={2} />
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] leading-tight pl-0.5">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== モバイル: 機種クイックアクセス ===== */}
      <div className="md:hidden px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-1.5 text-[var(--text-secondary)]">
            <MonitorPlay size={16} className="text-[var(--primary)]" />
            機種データ
          </h2>
          <Link href="/machines" className="text-[10px] text-[var(--primary)] font-medium">
            すべて →
          </Link>
        </div>
        {machines.length > 0 ? (
          <div className="space-y-1.5">
            {machines.map((machine) => (
              <Link
                key={machine.id}
                href={`/history/${machine.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] active:bg-[var(--bg-card-solid)] transition-all"
              >
                <span className="font-bold text-sm text-[var(--text-primary)]">
                  {machine.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {machine.numbers.length}台
                  </span>
                  <ChevronRight size={14} className="text-[var(--text-muted)]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)] text-xs">
            登録されている機種がありません
          </div>
        )}
      </div>

      {/* ===== PC: フルヒーローセクション ===== */}
      <div className="hidden md:flex relative w-full h-[400px] mb-12 items-center justify-center overflow-hidden">
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
            <div className="text-7xl font-black tracking-widest text-[var(--text-primary)] drop-shadow-md mb-1"
              style={{ fontFamily: 'serif', letterSpacing: '0.15em' }}>
              設鑑
            </div>
            <div className="text-xs tracking-[0.5em] text-[var(--primary)] font-medium uppercase border-t border-b border-[var(--primary)]/40 px-4 py-1">
              SEKKAN
            </div>
          </div>
          <p className="text-base font-medium text-[var(--text-secondary)] tracking-wider">
            パチスロ稼働データ蓄積・設定分析ツール
          </p>
        </div>
      </div>

      {/* ===== PC: メニューカード & 機種リンク ===== */}
      <div className="hidden md:block container mx-auto px-4">
        {/* Bento Grid (作戦司令室レイアウト) */}
        <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">

          {/* 左側の最優先アクション (狙い台) */}
          {menuItems.filter(i => i.href === '/targets').map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="col-span-1 flex flex-col items-center justify-center p-8 rounded-2xl border border-[var(--primary)]/30 bg-[var(--bg-card)] hover:border-[var(--primary)] hover:bg-[var(--bg-card-solid)] transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]"
            >
              <div className={`p-5 rounded-full mb-6 ${item.color} ${item.bg} scale-110`}>
                <item.Icon size={36} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black mb-2 text-[var(--text-primary)] tracking-wide">
                {item.label}
              </h2>
              <p className="text-sm text-[var(--text-muted)] text-center font-medium">
                {item.description}
              </p>
            </Link>
          ))}

          {/* 右側のメインボード (2x2 グリッド) */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {menuItems.filter(i => i.href !== '/targets').map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-start justify-center p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-card-solid)] transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-xl ${item.color} ${item.bg}`}>
                    <item.Icon size={24} strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    {item.label}
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-muted)] pl-1">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
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
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
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
