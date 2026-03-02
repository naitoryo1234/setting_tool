'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PenLine, BarChart2, List, Crosshair, Home, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const links = [
    { href: '/', label: 'HOME', Icon: Home },
    { href: '/machines', label: '機種データ', Icon: LayoutGrid },
    { href: '/input', label: '入力', Icon: PenLine },
    { href: '/analysis', label: '分析', Icon: BarChart2 },
    { href: '/targets', label: '狙い台', Icon: Crosshair },
    { href: '/records', label: '記録', Icon: List },
]

export default function Navigation() {
    const pathname = usePathname()

    return (
        <>
            {/* デスクトップ: 上部ナビゲーション */}
            <nav className="hidden md:block sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--bg-card-solid)]">
                <div className="container h-[var(--nav-height)] flex items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80 group">
                        <div className="flex items-center justify-center w-10 h-10 border border-[var(--primary)] text-[var(--primary)] font-bold text-lg select-none"
                            style={{ fontFamily: 'serif' }}>
                            鑑
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-lg font-bold tracking-widest text-[var(--text-primary)]" style={{ fontFamily: 'serif' }}>
                                設鑑
                            </span>
                            <span className="text-[9px] tracking-[0.3em] text-[var(--primary)] font-medium uppercase">
                                SEKKAN
                            </span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-1">
                        {links.map((link) => {
                            const isActive = pathname.startsWith(link.href)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                                        isActive === true && link.href !== '/' ? "text-[var(--primary)] bg-[var(--primary)]/10" :
                                            isActive === true && link.href === '/' && pathname === '/' ? "text-[var(--primary)] bg-[var(--primary)]/10" :
                                                "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
                                    )}
                                >
                                    <link.Icon size={18} />
                                    {link.label}
                                    {(isActive === true && link.href !== '/' || (isActive === true && link.href === '/' && pathname === '/')) && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)] rounded-full mx-2" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* モバイル: 下部タブバー */}
            {/* モバイル: 下部タブバー */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card-solid)] border-t border-[var(--border-color)] flex items-stretch pb-[env(safe-area-inset-bottom)]">
                {links.map((link) => {
                    const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[60px] transition-colors relative",
                                isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 w-8 h-[2px] bg-[var(--primary)] rounded-b-sm" />
                            )}
                            <div className={cn("transition-transform duration-200", isActive && "scale-105")}>
                                <link.Icon size={18} />
                            </div>
                            <span className={cn("text-[9px] font-medium transition-all leading-none", isActive && "font-bold")}>
                                {link.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}

