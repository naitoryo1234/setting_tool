import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
    title?: string
    message: string
    retry?: () => void
    className?: string
}

export function ErrorState({
    title = "エラーが発生しました",
    message,
    retry,
    className
}: ErrorStateProps) {
    return (
        <Alert variant="destructive" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-4 items-start">
                <p>{message}</p>
                {retry && (
                    <Button variant="outline" size="sm" onClick={retry} className="bg-background text-foreground hover:bg-accent">
                        再試行
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    )
}
