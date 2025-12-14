import { dayjs } from 'element-plus';

function isValidDate(value) {
    const time = new Date(value).getTime();
    return Number.isFinite(time);
}

export function formatDate(date, fallback = '-') {
    if (!isValidDate(date)) return fallback;
    return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateTime(date, fallback = '-') {
    if (!isValidDate(date)) return fallback;
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}


