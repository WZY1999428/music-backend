let app = null
let container = null
import RightClickMenu from '../components/RightClickMenu/index.vue'
export function showMenu(items, event, data) {
    event.preventDefault()

    // 先清理上一次的菜单
    if (app) {
        app.unmount()
        container.remove()
        app = null
        container = null
    }

    const x = event.clientX
    const y = event.clientY
    container = document.createElement('div')
    document.body.appendChild(container)

    app = createApp({
        render() {
            return h(RightClickMenu, {
                items,
                x,
                y,
                onSelect: (item) => {
                    item.action?.(data)
                    closeMenu()
                },
                onClose: closeMenu
            })
        }
    })

    app.mount(container)

    // 点击其他地方关闭菜单
    function handleClickOutside() {
        closeMenu()
    }

    function closeMenu() {
        if (!app) return
        app.unmount()
        container.remove()
        app = null
        container = null
        document.removeEventListener('click', handleClickOutside)
    }

    document.addEventListener('click', handleClickOutside)
}
