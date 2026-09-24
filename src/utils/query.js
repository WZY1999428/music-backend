/**
 * 过滤常规非超级管理员且已启用的用户条件
 */
export const NORMAL_ENABLED_USER_QUERY = {
    enabled: { $ne: 0 },
    isSuperAdmin: { $ne: 1 }
};