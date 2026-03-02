import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
    title: ReactNode
    subtitle?: string
    startAdornment?: ReactNode
    children?: ReactNode // Actions area
    className?: string
    backHref?: string
}

export function PageHeader({
    title,
    subtitle,
    startAdornment,
    children,
    className,
    backHref
}: PageHeaderProps) {
    return (
        <div className={cn("space-y-3 md:space-y-4 pb-4 md:pb-6", className)}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    {backHref && (
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <Link href={backHref}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                    )}
                    {startAdornment && (
                        <div className="flex h-10 w-10 items-center justify-center text-[var(--primary)] shrink-0">
                            {startAdornment}
                        </div>
                    )}
                    <div className="space-y-0.5 border-l-2 border-[var(--primary)] pl-3">
                        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-[var(--text-muted)] font-medium tracking-wider">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {children && (
                    <div className="flex items-center gap-2">
                        {children}
                    </div>
                )}
            </div>
            <Separator className="bg-border/50" />
        </div>
    )
}
