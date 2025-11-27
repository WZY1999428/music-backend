const Database = require("./db.js");
const path = require('path');
const db = new Database(path.resolve("", process.env.SQLITE_DB_PATH));

db.create("users",
    {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT",
        username: "TEXT",
        type: "TEXT",
        password: "TEXT"
    }).then(() => {
        db.insert("users", { username: "admin", type: "admin", password: "admin" }).then(() => console.log("admin 初始化成功"));
    });

db.create("kv",
    {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT",
        key: "TEXT",
        value: "TEXT"
    });

db.create("tokens",
    {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT",
        token: "TEXT",
        expires: "INTEGER",
        user_id: "INTEGER"
    });


module.exports = db;