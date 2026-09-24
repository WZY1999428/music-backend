import uploadModel from "@/database/model/upload"
import fs from "node:fs/promises"
import path from "node:path"
export default {
    action: '删除上传文件',
    logType: 'DELETE_UPLOAD_FILES',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { fileId } = ctx.request.query;
        const file = await uploadModel.findOne({ id: { $eq: fileId } })
        if (!file) {
            ctx.fail('删除失败，文件不存在');
            return;
        }

        await fs.unlink(path.join(process.cwd(), "public", file.url))
        await uploadModel.deleteOne({ id: { $eq: fileId } })

        ctx.success("删除成功");
    },
}