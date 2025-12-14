import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import "./assets/iconfont/iconfont.js"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/element-plus.css'
import IconSprite from "./components/IconSprite.vue";
import router from './router'
import App from './App.vue'


const app = createApp(App)
const pinia = createPinia()


app.component("IconSprite", IconSprite);

app.use(ElementPlus).use(router).use(pinia).mount('#app')
