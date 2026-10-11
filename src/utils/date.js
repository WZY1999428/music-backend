/**
 * 将日期范围转换为完整的时间范围
 *
 * @param {[string, string]} range - [开始日期, 结束日期]
 * @returns {[string, string]}
 *
 * @example
 * toDateTimeRange(["2026-09-01", "2026-09-13"])
 * // ["2026-09-01 00:00:00", "2026-09-13 23:59:59"]
 */

import dayjs from "dayjs"

export function toDateTimeRange(range) {
    if (!Array.isArray(range) || range.length < 2) {
        return []
    }

    const [start, end] = range

    return [
        `${start} 00:00:00`,
        `${end} 23:59:59`,
    ]
}


export function formatDate(date, format = "YYYY-MM-DD") {
    try {
        return dayjs(date).format(format)
    } catch (error) {
        return null
    }
}

export function formatDateTime(date, format = "YYYY-MM-DD HH:mm:ss") {
    try {
        return dayjs(date).format(format)
    } catch (error) {
        return null
    }
}


