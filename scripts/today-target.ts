import prisma from '../lib/prisma'

async function main() {
    const id = 'cmlj5u7rv000172g9pyrlc8tu'
    const recs = await prisma.record.findMany({
        where: { machineId: id },
        orderBy: { date: 'asc' }
    })

    const dates = [...new Set(recs.map(r => r.date.toISOString().split('T')[0]))].sort()
    console.log('DB内の全日付:', dates.join(', '))

    const last4 = dates.slice(-4)
    const lastDay = dates[dates.length - 1]
    console.log('\n直近4日間:', last4.join(', '))

    // 前日ランキング
    console.log('\n=== 前日(' + lastDay + ') 差枚ランキング ===')
    const day1 = recs
        .filter(r => r.date.toISOString().split('T')[0] === lastDay)
        .sort((a, b) => a.diff - b.diff)
    day1.forEach((r, i) => {
        const rp = r.reg && r.reg > 0 && r.games ? Math.round(r.games / r.reg) : '-'
        console.log(`${i + 1}位: #${r.machineNo} diff=${r.diff > 0 ? '+' : ''}${r.diff} G=${r.games} R=${r.reg} REG=1/${rp}`)
    })

    // 直近2日間
    const last2 = dates.slice(-2)
    console.log('\n=== 直近2日間(' + last2.join('~') + ') 累計 ===')
    const d2map = new Map<number, number>()
    recs.filter(r => last2.includes(r.date.toISOString().split('T')[0]))
        .forEach(r => d2map.set(r.machineNo, (d2map.get(r.machineNo) || 0) + r.diff))
        ;[...d2map.entries()].sort((a, b) => a[1] - b[1])
            .forEach(([no, diff], i) => console.log(`${i + 1}位: #${no} diff=${diff > 0 ? '+' : ''}${diff}`))

    // 直近4日間
    console.log('\n=== 直近4日間(' + last4[0] + '~' + last4[3] + ') 累計 ===')
    const d4map = new Map<number, number>()
    recs.filter(r => last4.includes(r.date.toISOString().split('T')[0]))
        .forEach(r => d4map.set(r.machineNo, (d4map.get(r.machineNo) || 0) + r.diff))
        ;[...d4map.entries()].sort((a, b) => a[1] - b[1])
            .forEach(([no, diff], i) => console.log(`${i + 1}位: #${no} diff=${diff > 0 ? '+' : ''}${diff}`))

    await prisma.$disconnect()
}
main()
