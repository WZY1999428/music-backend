const { odm } = require("./init")
const { Schema } = require("mysql-odm/schema");
const dayjs = require("dayjs")
const hooks = {
    beforeInsert(data) {
        data.createdAt = dayjs().format("YYYY-MM-DD HH:mm:ss")
    },
    beforeUpdate(_, data) {
        data.updatedAt = dayjs().format("YYYY-MM-DD HH:mm:ss")
    }
};

const userSchema = new Schema({
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    username: { type: 'varchar', length: 255, nullable: false },
    password: { type: 'varchar', length: 255, nullable: false },
    email: { type: 'varchar', length: 255, nullable: false },
    rule: { type: 'varchar', length: 255, nullable: false },
    createdAt: { type: 'varchar' },
    updatedAt: { type: 'varchar' },
}, hooks);

const userModel = odm.model('user', userSchema);

module.exports = userModel;