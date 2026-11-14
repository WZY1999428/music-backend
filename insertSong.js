import axios from "axios";
import fs from "fs"
import FormData from "form-data"
import path from "path"
const request = axios.create({
    baseURL: "http://192.168.0.105:8848/admin-api",
    timeout: 10000,
    headers: {
        Authorization: '407dbbc655f54874a4680465a6a4b8cd',
    }
})
const dir = "Y:/music"


const files = new Map(fs.readdirSync(dir).map(file => [file.split(path.sep).pop().replace(/-\d+-\d+(?=\.(flac|mp3|wav)$)/, ""), file]))

const notInsert = []
const songList = JSON.parse(fs.readFileSync("./songs整理结果.json"))
for (const song of songList) {
    try {
        const formdata = new FormData()
        formdata.append("song", fs.createReadStream(path.join(dir, files.get(song.filename))))
        const res = await request.post('/upload/audio', formdata, {
            headers: formdata.getHeaders()
        });
        const data = res.data.data;

        if (!data.artists.length || res.data.code != 0) {
            notInsert.push(song)
            continue
        }

        const form = {
            title: song.title,
            cover: {
                "id": 10064,
                "url": "/cover/2026/10/26/1793003027713-ChatGPT Image 2025年4月19日 23_31_59.png"
            },
            mvUrl: null,
            enabled: 1,
            songTypes: song.songTypes,
            publishDate: song.publishDate,
            singerList: data.singerList ?? []
        }
        form.singerList = data.artists.map(item => item.id)
        form.audioList = [
            {
                url: data.url,
                filename: data.filename,
                fileId: data.fileId,
                duration: data.duration,
                format: data.codec,
                quality: "2",
                bitrate: data.bitrate,
                sampleRate: data.sampleRate,
                bitDepth: data.bitsPerSample,
                size: data.size,
            }
        ]
        const result = await request.post('/music/song/save', form)
        console.log(result.data);

    } catch (error) {
        console.log(error);

        notInsert.push(song)
    }
}



// fs.writeFileSync("notInsert.json", JSON.stringify(notInsert, null, 2))
