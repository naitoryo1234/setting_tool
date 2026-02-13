import { RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
    message?: string
    className?: string
    fullScreen?: boolean
}

export function LoadingState({
    message = "読み込み中...",
    className,
    fullScreen = false
}: LoadingStateProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <RotateCw className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-lg font-medium text-muted-foreground animate-pulse">
                        {message}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
            <RotateCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground animate-pulse">
                {message}
            </p>
        </div>
    )
}
