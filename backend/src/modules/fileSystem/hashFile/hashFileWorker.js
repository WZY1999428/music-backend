
const { parentPort } = require('node:worker_threads');
const { createReadStream } = require("fs");
const fs = require("fs-extra");
const crypto = require("crypto");

parentPort.on('message', (message) => {
    hashFile(message.filePath).then((result) => {
        parentPort.postMessage({ code: "success", data: result });
    }).catch((error) => {
        parentPort.postMessage({ code: "error", data: error });
    });
});


function hashFile(filePath) {
    return new Promise(async (resolve, reject) => {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            resolve("");
        } else {
            let stream;
            try {
                stream = createReadStream(filePath);
            } catch (err) {
                return reject(err);
            }
            const hash = crypto.createHash("md5");
            stream.on("data", chunk => hash.update(chunk));
            stream.on("end", () => resolve(hash.digest("hex")));
            stream.on("error", err => reject(err));
        }
    });
}
