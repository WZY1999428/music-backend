const { Favorite } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    const pageIndex = parseInt(ctx.query.pageIndex) || 1;
    const pageSize = parseInt(ctx.query.pageSize) || 20;
    const favoriteQuery = await Favorite.joinFind({
        fields: [
            't1.id',             
            't3.username',       
            't2.name AS fileName', 
            't2.size',          
            't1.createdAt'      
        ],
        joins: [
            {
                name: 'files',
                type: 'INNER JOIN', // 可选：INNER JOIN, LEFT JOIN
                on: 't1.fileId = t2.id'
            },
            {
                name: 'users',
                type: 'INNER JOIN',
                on: 't1.userId = t3.id'
            }
        ],
        filters: [
            {
                field: 't1.userId', 
                op: '=',            
                value: ctx.state.user.userId           
            },
        ],
        pageIndex, 
        pageSize 
    });

    console.log(favoriteQuery);
    ctx.success(favoriteQuery);
};