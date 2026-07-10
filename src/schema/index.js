const { Schema } = require("mysql-odm/schema");

const userSchema = new Schema({
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: { type: 'varchar', length: 255, nullable: false },
    age: { type: 'int', default: 0 }
});

module.exports = userSchema;