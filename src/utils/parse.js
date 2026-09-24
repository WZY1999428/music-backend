export function parseJson(str) {
    try {
        return JSON.parse(str)
    } catch (error) {
        return null;
    };
}



export function formatUploadFileRef(files, id) {
    const f = files.find(it => it.id == id);
    return f ? { id: f.id, url: f.url } : null; // 或 undefined
};



export function parseJsonToArray(str) {
    try {
        const json = JSON.parse(str);
        return Array.isArray(json) ? json : [json];
    } catch (error) {
        return null;
    };
}