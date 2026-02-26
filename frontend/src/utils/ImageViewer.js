import ImageViewer from '../components/ImageViewer.vue'
let viewerApp = null
let vm = null
let imagesRef = ref([])

export function showImageViewer(images = [], opts = {
    index: 0,
    loop: false,
}) {
    imagesRef.value = images;
    if (!viewerApp) {
        const div = document.createElement('div');
        document.body.appendChild(div)
        viewerApp = createApp({
            render() {
                return h(ImageViewer, {
                    ref: 'viewerRef',
                    images: imagesRef.value,
                    opts
                })
            }
        })
        vm = viewerApp.mount(div)
    } else {
        vm.$refs.viewerRef.show()
    }
}
