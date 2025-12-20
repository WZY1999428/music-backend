import { getFiles } from "@/request/files"
export const useFileStore = defineStore('file', () => {
    const breadcrumbs = ref([])
    const files = ref([])
    const loading = ref(false)
    const error = ref(null)
    const fileCache = new Map();
    const keyword = ref('');
    const addPath = (id, name) => {
        if (loading.value) return;
        if (!breadcrumbs.value.some(b => b.id === id)) {
            breadcrumbs.value.push({ id, name });
        }
        keyword.value = '';
        refresh(false);
    };
    const removePath = (index) => {
        if (loading.value) return;
        keyword.value = '';
        breadcrumbs.value.splice(index);
        refresh(false);
    };
    const resetPath = () => {
        if (loading.value) return;
        breadcrumbs.value = [];
        refresh(false);
    };
    function refresh(refresh = true) {
        if (loading.value) return;
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
        getFiles({ parentId, keyword: keyword.value }).then(res => {
            const sorted = res.data.sort((a, b) => b.isFolder - a.isFolder);
            fileCache.set(parentId, sorted);
            files.value = sorted;
        }).catch(err => {
            error.value = err
        }).finally(() => {
            loading.value = false;
        })

    }
    return { breadcrumbs, files, loading, error, addPath, removePath, resetPath, fetchFiles, refresh, keyword }
})
