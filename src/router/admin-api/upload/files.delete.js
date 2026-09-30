import uploadModel from "@/database/model/upload"
import fs from "node:fs/promises"
import path from "node:path"
export default {
    action: '删除上传文件',
    logType: 'DELETE_UPLOAD_FILES',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { fileIds } = ctx.request.query;
        const files = await uploadModel.findMany({ id: { $in: fileIds } })
        if (!files || files.length === 0) {
            ctx.fail('删除失败，文件不存在');
            return;
        }

        for (const file of files) {
            await fs.unlink(path.join(process.cwd(), "public", file.url)).catch(err => {
                console.error('删除文件失败:', err);
            })
        }
        await uploadModel.deleteMany({ id: { $in: fileIds } })

        ctx.success("删除成功");
    },
}