/** @type {Controller} */
export default (ctx) => {
    const { id } = ctx.request.query;
    ctx.success(id)
}