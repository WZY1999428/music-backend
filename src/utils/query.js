import artistModel from "@/database/model/music/artist.js"

/**
 * 过滤常规非超级管理员且已启用的用户条件
 */

export const NORMAL_ENABLED_USER_QUERY = {
    enabled: { $ne: 0 },
    isSuperAdmin: { $ne: 1 }
};


export async function fillArtistList(list) {
    const artistIds = Array.from(new Set(list.flatMap(item => item.artistList || [])))

    if (!artistIds.length) {
        return list
    }

    const artistList = await artistModel.findMany(
        {
            id: { $in: artistIds }
        },
        {
            fields: ["id", "name", "realName"]
        }
    )

    const artistMap = new Map(
        artistList.map(artist => [artist.id, artist])
    )

    list.forEach(item => {
        item.artistList = (item.artistList || [])
            .map(id => {
                const artist = artistMap.get(id)

                if (!artist) {
                    return null
                }

                return {
                    id,
                    name: artist.name,
                    realName: artist.realName
                }
            })
            .filter(Boolean)
    })

    return list
}
