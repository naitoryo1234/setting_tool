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
        <div className={cn("space-y-4 pb-6", className)}>
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                            {startAdornment}
                        </div>
                    )}
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground font-medium">
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
