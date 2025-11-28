import { createApp } from 'vue'
import './style.css'
import "./assets/iconfont/iconfont.js"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/element-plus.css'
import router from './router'
import App from './App.vue'
const app = createApp(App)

import IconSprite from "./components/IconSprite.vue";

app.component("IconSprite", IconSprite);

app.use(ElementPlus)
app.use(router)
app.mount('#app')
