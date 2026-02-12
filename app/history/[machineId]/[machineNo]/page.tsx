import { getMachineNoHistory } from '@/lib/actions'
import HistoryClient from './HistoryClient'

export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ machineId: string; machineNo: string }>
}

export default async function HistoryPage({ params }: Props) {
    const { machineId, machineNo: machineNoStr } = await params
    const machineNo = parseInt(machineNoStr)
    const { machineName, records } = await getMachineNoHistory(machineId, machineNo)

    return (
        <HistoryClient
            machineName={machineName}
            machineNo={machineNo}
            records={records}
            machineId={machineId}
        />
    )
}
