export default {
    action: 'app获取歌曲列表',
    logType: 'APP_GET_SONG_LIST',
    enableLog: true,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        ctx.success();
    },
}
