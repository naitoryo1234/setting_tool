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
    /** 差枚計算の係数 */
    diffCalc: {
        coinsPerBig: number   // BIG1回あたりの獲得枚数
        coinsPerGame: number  // 1Gあたりの消費枚数
    }
}

export interface StoreConfig {
    /** 店舗名 */
    name: string
    /** P's CUBE ベースURL */
    baseUrl: string
    /** 登録済み機種の設定 */
    machines: MachineConfig[]
}

// 保土ヶ谷ガイアの設定
export const HODOGAYA_GAIA: StoreConfig = {
    name: '保土ヶ谷ガイア',
    baseUrl: 'https://www.pscube.jp/dedamajyoho-P-townDMMpachi/c745639/cgi-bin',
    machines: [
        {
            searchName: '北斗の拳',
            dbName: '北斗転生',
            machineNoRange: { start: 238, end: 250 },
            diffCalc: {
                coinsPerBig: 134,
                coinsPerGame: 1.52,
            },
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
