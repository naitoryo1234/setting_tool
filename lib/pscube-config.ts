/**
 * P's CUBE スクレイピング設定
 * 店舗・機種・係数のマッピング定義
 */

export interface MachineConfig {
    /** P's CUBE上の機種名（検索キーワード） */
    searchName: string
    /** DB上の機種名 */
    dbName: string
    /** 台番号の範囲 */
    machineNoRange: { start: number; end: number }
    /** 台数 */
    machineCount: number
    /** 差枚計算の係数 */
    diffCalc: {
        coinsPerBig: number   // BIG1回あたりの獲得枚数
        coinsPerGame: number  // 1Gあたりの消費枚数
    }
    /** URLで使用する機種名（二重エンコード済み） */
    encodedName: string
}

export interface StoreConfig {
    /** 店舗名 */
    name: string
    /** P's CUBE 機種データページURL */
    machinePageUrl: string
    /** 共通パラメータ */
    params: {
        cd_ps: string
        bai: string
    }
    /** 登録済み機種の設定 */
    machines: MachineConfig[]
}

// 保土ヶ谷ガイアの設定
export const HODOGAYA_GAIA: StoreConfig = {
    name: '保土ヶ谷ガイア',
    machinePageUrl: 'https://www.pscube.jp/dedamajyoho-P-townDMMpachi/c745639/cgi-bin/nc-v05-011.php',
    params: {
        cd_ps: '2',
        bai: '21.7391',
    },
    machines: [
        {
            searchName: '北斗の拳',
            dbName: '北斗転生',
            machineNoRange: { start: 238, end: 250 },
            machineCount: 13,
            diffCalc: {
                coinsPerBig: 134,
                coinsPerGame: 1.52,
            },
            encodedName: 'L+%25E3%2582%25B9%25E3%2583%259E%25E3%2582%25B9%25E3%2583%25AD+%25E5%258C%2597%25E6%2596%2597%25E3%2581%25AE%25E6%258B%25B3+%25E8%25BB%25A2%25E7%2594%259F%25E3%2581%25AE%25E7%25AB%25A02+MW',
        },
    ],
}

// デフォルト店舗
export const DEFAULT_STORE = HODOGAYA_GAIA

/**
 * 差枚数を計算する
 */
export function calculateDiff(
    big: number,
    games: number,
    config: MachineConfig['diffCalc']
): number {
    return Math.round((big * config.coinsPerBig) - (games * config.coinsPerGame))
}

/**
 * P's CUBEの機種ページURLを構築
 * ハッシュフラグメント: #台数;2000;YYYYMMDD;0;cd_dai;1;0;604
 */
export function buildMachinePageUrl(
    store: StoreConfig,
    machine: MachineConfig,
    dateStr: string
): string {
    const dateCompact = dateStr.replace(/-/g, '') // YYYYMMDD
    const hash = `#${machine.machineCount};2000;${dateCompact};0;cd_dai;1;0;604`
    return `${store.machinePageUrl}?cd_ps=${store.params.cd_ps}&bai=${store.params.bai}&nmk_kisyu=${machine.encodedName}${hash}`
}
