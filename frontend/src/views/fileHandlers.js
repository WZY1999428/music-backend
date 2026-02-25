import { recentlyFiles } from "@/request/trash"
import { deleteFavorite, addFavorite } from "@/request/favorite"
import { deleteFile, syncFile, createFolder, copyFile, mvFile } from "@/request/files"
import cpSvg from "@/assets/svg/cp.svg?raw"
export const fileStore = useFileStore();
export const viewType = ref(getItem("viewType") || "list");
export const loadingSvg = ref(cpSvg)
export const loading = ref(false)
fileStore.fetchFiles(0);
export const loadingText = ref('')
export const selectFiles = reactive([])
const OP = {
    COPY: 'copy',
    MOVE: 'move'
}
const operationContext = {
    tempFiles: [],
    type: null,

    set(type, files) {
        this.type = type
        this.tempFiles.length = 0
        this.tempFiles.push(...files)
    },

    setCopy(files) {
        this.set(OP.COPY, files)
    },

    setMove(files) {
        this.set(OP.MOVE, files)
    },

    clear() {
        this.type = null
        this.tempFiles.length = 0
    }
}




export function handleRowContextMenu({ event, file }) {
    const items = [
        { label: '刷新', icon: "refresh", action: () => fileStore.forceRefresh() },
        {
            label: '排序方式', children: [
                { label: '按名称排序', action: () => { } },
                { label: '按创建时间排序', action: () => { } }]
        },
        {
            label: '查看方式', children: [
                { label: '列表', icon: viewType.value == 'list' ? 'selected' : null, iconSize: 15, action: toggleViewType },
                { label: '图标', icon: viewType.value == 'grid' ? 'selected' : null, iconSize: 15, action: toggleViewType }
            ]
        }];
    if (file) {
        items.insertAt(3, ...[
            { label: '复制', icon: "copy", action: (file) => operationContext.setCopy(selectFiles.length ? selectFiles : [file]) },
            { label: '移动', icon: "", action: (file) => operationContext.setMove(selectFiles.length ? selectFiles : [file]) },
            { label: '删除', icon: "delete", action: (file) => deleteFileFun([file]) },
            { label: file.favoriteId ? '取消收藏' : '收藏', action: (file) => toggleFavorite([file]) },
            { label: '下载', icon: "cloudDownload", action: (file) => downloadFile(file.id, file.access_token) },
            { label: '属性', icon: "attribute", action: (file) => downloadFile(file.id, file.access_token) },
        ])
        if (file.isFolder) {
            items.insertAt(items.length - 1, { label: '同步目录内容', icon: "dataProcess", action: (file) => handleSyncFile(file) });
            if (operationContext.tempFiles.length && !operationContext.tempFiles.some(e => e.id == file.id)) {
                items.insertAt(3, { label: '粘贴', icon: "", action: (target) => handlePaste(target) });
            }
        }
    } else {
        items.insertAt(3, ...[
            { label: '新建文件', icon: "", action: () => handleCreateFolder() },
            { label: '新建文件夹', icon: "", action: () => handleCreateFolder() },
            { label: '同步目录内容', icon: "dataProcess", action: () => handleSyncFile() },
        ]);
        if (selectFiles.length) {
            items.insertAt(3, 0, ...[{ label: '复制', icon: "", action: () => operationContext.setCopy(selectFiles) }, { label: '移动', action: () => operationContext.setMove(selectFiles) }]);
        }
        if (operationContext.tempFiles.length) {
            const last = fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1];
            if ((!last && !operationContext.tempFiles.some(e => e.parentId == 0)) || (last && !operationContext.tempFiles.some(e => e.id == last.id || e.parentId == last.id))) {
                items.insertAt(3, { label: '粘贴', icon: "", action: (target) => handlePaste(target) });
            }
        }
    }
    showMenu(items, event, file)
}



export function openFile(file) {
    if (file.isFolder) {
        fileStore.addPath(file.id, file.name);
    } else {
        if (['jpg', 'jpeg', 'png', 'webp'].includes(file.extension)) {
            showImageViewer([getFileUrl(file.id, file.access_token)]);
        } else {
            downloadFile(file.id, file.access_token);
        }
    }
}

export async function toggleFavorite(files) {
    try {
        const favorites = files.filter(e => e.favoriteId).map(e => e.favoriteId);
        const unFavorites = files.filter(e => !e.favoriteId).map(e => e.id);
        if (favorites.length) await deleteFavorite({ ids: favorites });
        if (unFavorites.length) await addFavorite({ ids: unFavorites });
        ElMessage.success("操作成功");
        fileStore.forceRefresh();
    } catch (error) {
        // ElMessage.error(`操作失败：${JSON.stringify(error)}`);
    }
}



export function recentlyFilesFun(files) {
    ElMessageBox.confirm(
        '确定要恢复这些文件吗?',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            beforeClose: (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = 'Loading...'
                    recentlyFiles({
                        fileIds: files.map(e => e.id)
                    }).then(_res => {
                        done()
                        ElMessage({
                            type: 'success',
                            message: '恢复成功',
                        })
                        fileStore.forceRefresh();
                    }).finally(() => {
                        instance.confirmButtonLoading = false
                        instance.confirmButtonText = '确定'
                    })
                } else {
                    done()
                }
            },
        },
    ).catch(() => { })
}
export function onMouseup(e) {
    if (e.button == 3) {
        fileStore.backPath();
        e.preventDefault()
    }
}
export function handlePaste(target) {
    if (!target) target = fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1];
    loading.value = true
    if (![OP.COPY, OP.MOVE].includes(operationContext.type)) return;
    loadingText.value = operationContext.type == OP.COPY ? ' 正在复制文件中...' : ' 正在移动文件中...'
    const req = operationContext.type == OP.COPY ? copyFile : mvFile
    req({
        destId: target ? target.id : 0,
        ids: operationContext.tempFiles.map(e => e.id)
    }).then(_res => {
        if (operationContext.type == OP.MOVE) operationContext.clear();
        ElMessage.success("粘贴成功")
        fileStore.forceRefresh();
    })
        .finally(() => {
            loading.value = false
        })
}

export function handleSyncFile(file) {
    if (file && !file.isFolder) return;
    if (!file) {
        file = fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1]
    }
    ElMessageBox.confirm(
        '确认同步此目录吗？同步过程中将根据磁盘实际内容更新数据库，未在磁盘中存在的文件将被移除。请勿在同步期间对文件进行增删改操作，以避免数据不一致或文件损坏。',
        '警告',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'danger',
            beforeClose: (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = 'Loading...'
                    syncFile({
                        id: file ? file.id : 0
                    }).then(_res => {
                        done()
                        ElMessage.success("同步成功")
                        fileStore.forceRefresh();
                    }).finally(() => {
                        instance.confirmButtonLoading = false
                        instance.confirmButtonText = '确定'
                    })
                } else {
                    done()
                }
            },
        },
    ).catch(() => { })
}

export function handleCreateFolder() {
    ElMessageBox.prompt('请输入文件夹名称', '创建文件夹', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入文件夹名称',
        inputPattern: /^.+$/,
        inputErrorMessage: '文件夹名称不能为空',
        inputValue: '新建文件夹',
        beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
                instance.confirmButtonLoading = true
                instance.confirmButtonText = '创建中...'
                const pId = fileStore.breadcrumbs.length > 0 ? fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1].id : 0;
                createFolder({
                    name: instance.inputValue,
                    parentId: pId
                }).then(_res => {
                    done()
                    ElMessage.success("创建成功")
                    fileStore.forceRefresh();
                }).finally(() => {
                    instance.confirmButtonLoading = false
                    instance.confirmButtonText = '确定'
                })
            } else {
                done()
            }
        },
    }).catch(() => { })
}


export function handleTableSelectionChange(e) {
    selectFiles.splice(0, selectFiles.length, ...e);
}

export function deleteFileFun(files) {
    const radio = ref("1")
    ElMessageBox({
        title: '警告',
        message: () => h('div', {}, [
            h('div', { class: 'text-red-500 text-sm mt-1 mb-2 line-clamp-3 ' }, `确定要删除${files.map(f => f.name).join(",")}吗?`),
            h(ElRadioGroup, {
                modelValue: radio.value,
                options: [
                    { label: '永久删除', value: '0' },
                    { label: '添加到回收站', value: '1' },
                ],
                'onUpdate:modelValue': (val) => {
                    radio.value = val
                },
            }),
        ]),
        beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
                instance.confirmButtonLoading = true
                instance.confirmButtonText = 'Loading...'
                deleteFile({
                    fileIds: files.map(e => e.id),
                    status: radio.value
                }).then(_res => {
                    done()
                    ElMessage.success("删除成功")
                    fileStore.forceRefresh();
                }).finally(() => {
                    instance.confirmButtonLoading = false
                    instance.confirmButtonText = '确定'
                })
            } else {
                done()
            }
        },
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
    }).catch(() => { })

}


function toggleViewType() {
    viewType.value = viewType.value === "list" ? "grid" : "list";
    setItem("viewType", viewType.value);
}


async function downloadFile(fileId, access_token) {
    const a = document.createElement('a');
    a.href = getFileUrl(fileId, access_token);
    a.download = fileId;
    a.target = '_blank';
    a.click();
}