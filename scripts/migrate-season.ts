/**
 * DB内のすべてのRecordおよびMachineNumberに対して
 * season=1を明示的に設定するためのマイグレーションスクリプト
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 マイグレーション開始: seasonカラムを1で初期化します...')

    // Recordテーブルの更新
    const updateRecords = await prisma.record.updateMany({
        data: { season: 1 }
    })
    console.log(`✅ ${updateRecords.count} 件の Record を season=1 に更新しました。`)

    // MachineNumberテーブルの更新
    const updateNumbers = await prisma.machineNumber.updateMany({
        data: { season: 1 }
    })
    console.log(`✅ ${updateNumbers.count} 件の MachineNumber を season=1 に更新しました。`)

    console.log('🎉 マイグレーション完了')
}

main()
    .catch((e) => {
        console.error('❌ マイグレーションエラー:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
