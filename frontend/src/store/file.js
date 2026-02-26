import { getFiles, getCategoryFiles } from "@/request/files"
import { getFavorites } from "@/request/favorite"
import { getRecentFiles } from "@/request/recentFiles"
import { getRecycleBin } from "@/request/trash"
const queryTypeMap = {
    myFile: getFiles,
    category: getCategoryFiles,
    recycleBin: getRecycleBin,
    favorite: getFavorites,
    recentFiles: getRecentFiles
}

const nameMap = {
    "myFile": '我的文件',
    "recentFiles": '最近使用',
    "favorite": '收藏夹',
    "recycleBin": '回收站',
    "image": "图片文件",
    "video": "视频文件",
    "document": "文档",
    "audio": "音频文件",
    "archive": "压缩包文件",
    "other": "其他文件",
}
const fileCache = new Map();

export const useFileStore = defineStore('file', () => {
    const breadcrumbs = ref([])
    const files = ref([])
    const rootName = ref('我的文件')
    const loading = ref(false)
    const error = ref(null)
    const queryType = ref('myFile');
    const keyword = ref('');
    const category = ref('');
    const addPath = (id, name) => {
        if (loading.value) return;
        if (!breadcrumbs.value.some(b => b.id === id)) {
            breadcrumbs.value.push({ id, name });
        }
        keyword.value = '';
        forceRefresh(false);
    };

    const backPath = () => {
        if (loading.value) return;
        if (breadcrumbs.value.length >= 0) {
            breadcrumbs.value.pop();
            forceRefresh(false);
        }
    };

    const removePath = (index) => {
        if (loading.value) return;
        if (index == breadcrumbs.value.length - 1) {
            forceRefresh(true);
            return;
        }
        keyword.value = '';
        breadcrumbs.value.splice(index + 1);
        forceRefresh(false);
    };
    const resetPath = () => {
        if (loading.value) return;
        breadcrumbs.value = [];
        forceRefresh(false);
    };
    function forceRefresh(refresh = true) {
        if (loading.value) return;
        if (refresh) fileCache.clear();
        const last = breadcrumbs.value[breadcrumbs.value.length - 1];
        fetchFiles(last ? last.id : 0, refresh);
    }

    function fetchFiles(parentId, refresh = false) {
        if (fileCache.has(parentId) && !refresh) {
            files.value = fileCache.get(parentId);
            return;
        }
        error.value = null;
        loading.value = true;
        files.value = [];
        const req = queryTypeMap[queryType.value] || getFiles;
        req(setQueryParams(parentId)).then(res => {
            const sorted = res.data.sort((a, b) => b.isFolder - a.isFolder);
            fileCache.set(parentId, sorted);
            files.value = sorted;
        }).catch(err => {
            error.value = err
        }).finally(() => {
            loading.value = false;
        })
    }


    function setFileType(type, cat) {
        if (loading.value) return;
        if (type == "category") category.value = cat;
        else category.value = '';
        keyword.value = '';
        breadcrumbs.value = [];
        rootName.value = nameMap[cat];
        fileCache.clear();
        queryType.value = type;
        forceRefresh(true);
    }


    function setQueryParams(parentId) {
        switch (queryType.value) {
            case 'myFile':
                return { parentId, keyword: keyword.value };
            case 'category':
                return { parentId, keyword: keyword.value, category: category.value };
        }
    }

    return { breadcrumbs, files, loading, error, rootName, queryType, keyword, addPath, removePath, resetPath, fetchFiles, forceRefresh, setFileType, backPath }
})
