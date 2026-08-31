import { menuButtonModel } from "@/database/model/system/menu.js";
/** @type {Controller} */
export default async (ctx) => {
    const id = ctx.request.query.id;
    $validate(id, "权限按钮ID不能为空");
    const result = await menuButtonModel.delete({ id })
    ctx.success(null, "删除成功")
}