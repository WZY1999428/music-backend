/** @type {Controller} */
export default (ctx) => {
    const { id } = ctx.request.params;
    ctx.success(id)
} 
