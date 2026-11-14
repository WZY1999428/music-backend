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


// 获取今日剩余秒数
export function getSecondsLeftToday() {
    const now = new Date();
    const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );
    return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}

// 获取指定日期当天剩余秒数
export function getSecondsLeft(date) {
    const now = new Date()
    const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
    )

    return (endOfDay.getTime() - now.getTime()) / 1000
}


export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}



/**
 * 获取本周及上周同期的时间范围
 * @param {Date} [date=new Date()] 当前时间
 * @returns {{
 *   now: Date,
 *   thisWeekStart: Date,
 *   thisWeekEnd: Date,
 *   lastWeekStart: Date,
 *   lastWeekEnd: Date
 * }}
 */
export function getWeekCompareRange(date = new Date()) {
    const now = new Date(date);

    // 本周一 00:00
    const thisWeekStart = new Date(now);
    const day = thisWeekStart.getDay() || 7;

    thisWeekStart.setDate(thisWeekStart.getDate() - day + 1);
    thisWeekStart.setHours(0, 0, 0, 0);

    // 上周同期起点
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // 上周同期终点
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    return {
        now,
        thisWeekStart,
        thisWeekEnd: now,
        lastWeekStart,
        lastWeekEnd
    };
}