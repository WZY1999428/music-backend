import ElementPlus from 'element-plus'

import 'element-plus/dist/index.css'
import "./assets/iconfont/iconfont.js"
import "./utils/expandArray"
import './assets/css/element-plus.css'
import './assets/css/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import icon from "./components/Icon.vue";
import router from './router'
import App from './App.vue'


const app = createApp(App)
const pinia = createPinia()


app.component("icon",icon);

app.use(ElementPlus).use(router).use(pinia).mount('#app')
