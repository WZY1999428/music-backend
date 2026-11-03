export default {
    action: '获取歌单类型',
    logType: 'GET_PLAYLIST_TABS',
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        ctx.success([
            {
                key: "recommend",
                label: "推荐",
            },
            {
                key: "pop",
                label: "流行"
            },
            {
                key: "light",
                label: "轻音乐"
            }, {
                key: "travel",
                label: "旅行"
            },
            {
                key: "study",
                label: "学习"
            },
            {
                key: "relaxing",
                label: "放松"
            },
            {
                key: "chinese",
                label: "华语"
            }, {
                key: "acg",
                label: "二次元"
            },
            {
                key: "sad",
                label: "伤感"
            }, {
                key: "healing",
                label: "治愈"
            }
        ]);
    },
} 