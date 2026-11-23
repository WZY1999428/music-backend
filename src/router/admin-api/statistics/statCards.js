import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
import artistModel from "@/database/model/music/artist.js"
import { songModel } from "@/database/model/music/song.js"

export default {
    action: '统计卡片',
    logType: 'STAT_CARDS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const [artistCard, regionCard] = await Promise.all([getArtistCard(), getArtistRegionCard()])
        const songCard = await getSongCard();
        ctx.success([artistCard, ...songCard, regionCard]);
    },
}



async function getArtistCard() {
    const [regionCount, artistCount] = await Promise.all([
        dictItemModel.count({
            query: {
                [dictItemModel.qualifyField("enabled")]: 1
            },
            field: dictItemModel.qualifyField("id"),
            distinct: true,
            joins: [
                {
                    table: dictTypeModel.table,
                    as: "dictType",
                    on: { "dictType.code": { $eq: "ARTIST_REGION" }, [dictItemModel.qualifyField("dictId")]: "dictType.id" }
                },
                {
                    table: artistModel.table,
                    as: "artist",
                    on: { "artist.area": dictItemModel.qualifyField("value") },
                }
            ]
        }),
        artistModel.count({})]
    );

    return {
        title: '歌手总数', value: artistCount,
        desc: `覆盖全球 ${regionCount} 个地区`,
        icon: 'TeamOutlined',
        color: 'blue'
    }
}



async function getSongCard() {
    const [mvCount, songCount] = await Promise.all([
        songModel.count({ query: { mvUrl: { $ne: null } } }),
        songModel.count({})]
    );

    return [
        {
            title: '歌曲总数', value: songCount,
            desc: `含 MV 歌曲 ${mvCount} 首`,
            icon: 'CustomerServiceOutlined',
            color: 'purple'
        },
        {
            title: 'MV 歌曲占比',
            value: (mvCount / songCount * 100).toFixed(1) + '%',
            desc: '',
            icon: 'VideoCameraOutlined',
            color: 'green'
        }
    ]

}



async function getArtistRegionCard() {
    const dictItems = await dictItemModel.aggregate({
        query: {
            [dictItemModel.qualifyField("enabled")]: 1
        },
        fields: dictItemModel.qualifyFields(["id", "title", "value"]),
        distinct: true,
        group: [dictItemModel.qualifyField("id")],
        sort: { total: "desc" },
        joins: [
            {
                table: dictTypeModel.table,
                as: "dictType",
                on: { "dictType.code": { $eq: "ARTIST_REGION" }, [dictItemModel.qualifyField("dictId")]: "dictType.id" }
            },
            {
                table: artistModel.table,
                as: "artist",
                on: { "artist.area": dictItemModel.qualifyField("value") },
                select: [{ type: "raw", fields: { "total": "COUNT(artist.id)" } }]
            }
        ]
    })

    return {
        title: '覆盖地区', value: dictItems.length,
        desc: `${dictItems[0].title}地区歌手最多`,
        icon: 'EnvironmentOutlined',
        color: 'orange'
    }
}
