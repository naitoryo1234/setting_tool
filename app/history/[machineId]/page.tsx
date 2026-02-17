import { getAnalysis } from '@/lib/actions'
import MachineModelSummaryClient from './MachineModelSummaryClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ machineId: string }>
}

export default async function MachineModelSummaryPage({ params }: Props) {
    const { machineId } = await params

    // Fetch analysis for all time (or default range? 'all' seems appropriate for a "history" summary)
    // Actually, user likely wants "Recent" or "All" history.
    // getAnalysis without dates returns all records.
    const analysis = await getAnalysis(machineId)

    if (!analysis) {
        notFound()
    }

    return (
        <MachineModelSummaryClient analysis={analysis} />
    )
}
