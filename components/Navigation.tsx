'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// アイコンコンポーネント（SVGインライン）
function IconInput({ active }: { active: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    )
}

function IconSummary({ active }: { active: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
        </svg>
    )
}

function IconAnalysis({ active }: { active: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
    )
}

function IconRecords({ active }: { active: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    )
}

const links = [
    { href: '/input', label: '入力', Icon: IconInput },
    { href: '/summary', label: '集計', Icon: IconSummary },
    { href: '/analysis', label: '分析', Icon: IconAnalysis },
    { href: '/records', label: '記録', Icon: IconRecords },
]

export default function Navigation() {
    const pathname = usePathname()

    return (
        <>
            {/* デスクトップ: 上部ナビゲーション */}
            <nav className="hidden md:block" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="container mx-auto max-w-5xl flex justify-between items-center px-4" style={{ height: 'var(--nav-height)' }}>
                    <Link href="/" className="flex items-center gap-2" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            ⚙ Setting Tool
                        </span>
                    </Link>
                    <div className="flex items-center gap-1">
                        {links.map((link) => {
                            const isActive = pathname.startsWith(link.href)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                        background: isActive ? 'var(--accent-glow)' : 'transparent',
                                    }}
                                >
                                    <link.Icon active={isActive} />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* モバイル: 下部タブバー */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 items-center"
                style={{
                    height: 'var(--mobile-nav-height)',
                    background: 'var(--bg-card)',
                    borderTop: '1px solid var(--border-color)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}
            >
                {links.map((link) => {
                    const isActive = pathname.startsWith(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all"
                            style={{
                                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                textDecoration: 'none',
                            }}
                        >
                            <link.Icon active={isActive} />
                            <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 400 }}>
                                {link.label}
                            </span>
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    width: '24px',
                                    height: '2px',
                                    background: 'var(--accent)',
                                    borderRadius: '0 0 2px 2px',
                                }} />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}
