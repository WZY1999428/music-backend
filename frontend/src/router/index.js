import { createWebHashHistory, createRouter } from 'vue-router'

import HomeView from '../views/index.vue'
import LoginView from '../views/login.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router;