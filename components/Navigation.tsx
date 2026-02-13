'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PenLine, PieChart, BarChart2, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const links = [
    { href: '/input', label: '入力', Icon: PenLine },
    { href: '/summary', label: '集計', Icon: PieChart },
    { href: '/analysis', label: '分析', Icon: BarChart2 },
    { href: '/records', label: '記録', Icon: List },
]

export default function Navigation() {
    const pathname = usePathname()

    return (
        <>
            {/* デスクトップ: 上部ナビゲーション */}
            <nav className="hidden md:block sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container h-[var(--nav-height)] flex items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
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
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative",
                                        isActive
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <link.Icon size={18} />
                                    {link.label}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full mx-2" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* モバイル: 下部タブバー */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[var(--mobile-nav-height)] bg-background/90 backdrop-blur-xl border-t grid grid-cols-4 items-center pb-safe">
                {links.map((link) => {
                    const isActive = pathname.startsWith(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 h-full w-full transition-colors relative",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 w-8 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-b-sm shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            )}
                            <div className={cn("transition-transform duration-200", isActive && "scale-110")}>
                                <link.Icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]")} />
                            </div>
                            <span className={cn("text-[10px] font-medium transition-all", isActive && "font-bold")}>
                                {link.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}

