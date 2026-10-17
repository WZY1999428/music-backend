
import { songModel } from "@/database/model/music/song"

export default {
    action: 'APP搜索音乐',
    logType: 'APP_SEARCH_MUSIC',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword } = ctx.request.body;
        $validate(keyword, "搜索关键词不能为空");
        const like = `%${keyword}%`
        const songs = await songModel.execute(`
            SELECT s.id, s.title, s.mvUrl, s.cover, s.playTotal, s.enabled, s.publishDate,
                    -- 使用 GROUP_CONCAT 把当前歌曲的所有歌手名字拼接起来展示
                    GROUP_CONCAT(a.name SEPARATOR ', ') AS artist_names
                FROM music_song s
                LEFT JOIN music_song_artist sa ON s.id = sa.songId
                LEFT JOIN music_artist a ON sa.artistId = a.id
                WHERE 
                    -- 检索条件：歌手名称匹配 OR 歌曲名匹配
                    a.name LIKE ?
                    OR s.title LIKE ?
                GROUP BY s.id, s.title, s.mvUrl, s.cover, s.playTotal, s.clickTotal, s.favoriteTotal, s.enabled, s.publishDate
                ORDER BY 
                    -- 核心优先级：只要这首歌关联的歌手里有一个匹配了查询词，权重就是 1，否则为 2
                    MIN(CASE WHEN a.name LIKE ? THEN 1 ELSE 2 END) ASC,
                    -- 次要排序：比如按播放量倒序，或者按发布日期倒序
                    s.playTotal DESC,
                    s.publishDate DESC;
            `, [like, like, like])
        ctx.success(songs);
    },
}