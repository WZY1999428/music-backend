import uploadModel from "@/database/model/upload"

export default {
    action: '获取上传文件列表',
    logType: 'GET_UPLOAD_FILES',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { filename, dateRange, pageIndex = 1, pageSize = 10 } = ctx.request.query;
        const query = {};
        const page = paginate(pageIndex, pageSize);
        if (filename && filename.trim()) query.filename = { $like: `%${filename.trim()}%` };

        if (Array.isArray(dateRange) && dateRange.length == 2) {
            const range = toDateTimeRange(dateRange);
            query['upload.createdAt'] = { $between: range };
        }

        const aggregate = uploadModel.aggregate({
            query,
            fields: [
                "upload.id",
                "upload.userId",
                "upload.originalName",
                "upload.filename",
                "upload.url",
                "upload.size",
                "upload.type",
                "upload.mimeType",
                "upload.createdAt",
                "system_user.nickname",
            ],
            joins: [{
                table: "system_user",
                type: "left",
                as: "system_user",
                on: { "system_user.id": "upload.userId" },
            }],
            group: ["upload.id"],
            sort: { "upload.createdAt": "desc" },
            ...page
        })

        const [list, total] = await Promise.all([aggregate, uploadModel.count({ query })])
        ctx.success({
            list: list,
            total: total,
        });
    },
}