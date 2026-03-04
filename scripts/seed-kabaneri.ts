import { PrismaClient } from '@prisma/client'
import { DEFAULT_STORE } from '../lib/pscube-config.ts'

const prisma = new PrismaClient()

async function main() {
    // 保土ヶ谷ガイアの storeId を取得
    const store = await prisma.store.findFirst({
        where: { name: DEFAULT_STORE.name }
    })

    if (!store) {
        throw new Error('Store not found')
    }

    // カバネリの機種を検索
    let machine = await prisma.machine.findFirst({
        where: { name: 'カバネリ海門XX', storeId: store.id }
    })

    // なければ作成
    if (!machine) {
        machine = await prisma.machine.create({
            data: {
                name: 'カバネリ海門XX',
                storeId: store.id
            }
        })
        console.log('Created machine:', machine.name)
    } else {
        console.log('Machine already exists:', machine.name)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
