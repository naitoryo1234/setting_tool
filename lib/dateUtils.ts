import { toZonedTime, format } from 'date-fns-tz'
import { startOfDay, endOfDay, addDays } from 'date-fns'

const TIMEZONE = 'Asia/Tokyo'

/**
 * 入力された日付(Date | string)をJSTとして解釈し、
 * その日の「00:00:00 JST」に相当する UTC Date オブジェクトを返す。
 * DB検索の "gte" (開始日) として使用する。
 * 
 * 例: "2024-02-01" -> 2024-02-01 00:00:00 JST (= 2024-01-31 15:00:00 UTC)
 */
export function toJstStartOfDay(date: Date | string): Date {
    // 文字列 "YYYY-MM-DD" の場合
    if (typeof date === 'string') {
        // YYYY-MM-DDT00:00:00+09:00 を作成して返す
        // これにより、JST 00:00 (UTC 前日15:00) の Date オブジェクトが生成される
        return new Date(`${date}T00:00:00+09:00`)
    }

    // Dateオブジェクトの場合
    // すでにDateオブジェクトなら、それをそのまま使うか、あるいはJSTとしての0時に合わせるか。
    // ここでは「Dateオブジェクトが渡されたら、それはすでに適切な時刻を指している」とみなすか、
    // あるいは toISOString() で UTC文字列表現にしてから再パースするか。
    // 安全のため、一度ISO文字列にしてから再度 Date にする (Timezone情報のリセット的な意味合い)
    // ただし、date がすでに UTC で正しい時刻を持っているならそのまま返すべきかもしれない。
    // 既存の逻辑に合わせて、単にコピーして返す (もしくは再生成)
    return new Date(date)
}

/**
 * 文字列 "YYYY-MM-DD" を受け取り、JST 00:00:00 時点の Date オブジェクトを返す
 */
export function parseJstDate(dateStr: string): Date {
    // もし "2024-02-01" なら "2024-02-01T00:00:00+09:00" を作る
    // これで正しく JST 00:00 を指す UTC Date (前日15:00) が生成される
    return new Date(`${dateStr}T00:00:00+09:00`)
}

/**
 * DB検索の "lt" (終了日+1日) として使用する。
 * 指定された日付の「翌日の 00:00:00 JST」を返す。
 * 
 * use: date < getNextDayStart(date)
 */
export function getNextJstDayStart(dateStr: string): Date {
    const date = parseJstDate(dateStr)
    // 1日足す
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    return nextDay
}

/**
 * Dateオブジェクトを "YYYY-MM-DD" (JST) 形式の文字列に変換する
 */
export function formatJstDate(date: Date): string {
    return format(toZonedTime(date, TIMEZONE), 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * 現在時刻 (JST) の "YYYY-MM-DD" を取得
 */
export function getTodayJst(): string {
    return formatJstDate(new Date())
}

/**
 * N日前の日付 (JST) の "YYYY-MM-DD" を取得
 */
export function getPastDateJst(daysAgo: number): string {
    const now = new Date()
    const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return formatJstDate(past)
}
