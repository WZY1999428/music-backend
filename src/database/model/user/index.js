const { odm } = require("../..")
const { Schema } = require("mysql-odm/schema");
const hooks = {
    beforeInsert(data) {
    },
    beforeUpdate(_, data) {
    }
};

const userSchema = new Schema({
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    username: { type: 'varchar', length: 255, nullable: false },
    password: { type: 'varchar', length: 255, nullable: false },
    email: { type: 'varchar', length: 255, nullable: false },
    rule: { type: 'varchar', length: 255, nullable: false },
    createdAt: { type: 'varchar', default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: 'varchar', default: 'CURRENT_TIMESTAMP' },
}, hooks);

const userModel = odm.model('user', userSchema);

module.exports = userModel;