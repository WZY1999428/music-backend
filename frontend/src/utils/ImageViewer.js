import ImageViewer from '../components/ImageViewer.vue'
let container = null
let viewerApp = null
export function showImageViewer(images = []) {
    if (!viewerApp) {
        container = document.createElement('div')
        container.style.position = 'fixed'
        container.style.zIndex = 1000
        container.style.top = 0
        container.style.left = 0
        container.style.right = 0
        container.style.bottom = 0
        document.body.appendChild(container)
        viewerApp = createApp({
            render() {
                return h(ImageViewer, {
                    ref: 'viewerRef',
                    images,
                })
            }
        })
        const vm = viewerApp.mount(container)
    }


    // vm.$refs.viewerRef.show()
}
