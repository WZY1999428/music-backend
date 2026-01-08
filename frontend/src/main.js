import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import "./assets/iconfont/iconfont.js"
import "./utils/expandArray"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import "viewerjs/dist/viewer.css";
import './assets/element-plus.css'
import icon from "./components/Icon.vue";
import router from './router'
import App from './App.vue'


const app = createApp(App)
const pinia = createPinia()


app.component("icon",icon);

app.use(ElementPlus).use(router).use(pinia).mount('#app')
