import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed bg-muted/40",
            className
        )}>
            {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
            <h3 className="text-lg font-semibold tracking-tight">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    )
}
