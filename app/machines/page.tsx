import Link from 'next/link'
import { getMachines } from '@/lib/actions'
import { PageHeader } from '@/components/PageHeader'
import { LayoutGrid, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MachinesDataPage() {
    const machines = await getMachines()

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-4 md:space-y-8">
            <PageHeader
                title="機種データ"
                subtitle="機種ごとの稼働実績・台番別データの閲覧"
                startAdornment={<LayoutGrid size={20} />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {machines.map((machine) => (
                    <Link
                        key={machine.id}
                        href={`/history/${machine.id}`}
                        className="group card-static p-5 border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                    {machine.name}
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    {(machine as any).numbers?.length || 0}台のデータ
                                </p>
                            </div>
                            <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>

            {machines.length === 0 && (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    登録された機種がありません
                </div>
            )}
        </div>
    )
}
