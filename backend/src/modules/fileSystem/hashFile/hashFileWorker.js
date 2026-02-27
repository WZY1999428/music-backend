
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
        try {
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                resolve("");
            } else {
                const stream = createReadStream(filePath);
                const hash = crypto.createHash("sha256");
                stream.on("data", chunk => hash.update(chunk));
                stream.on("end", () => resolve(hash.digest("hex")));
                stream.on("error", err => reject(err));
            }
        } catch (error) {
            return reject(error);
        }
    });
}
