import { createWebHashHistory, createRouter } from 'vue-router'

import HomeView from '../views/index.vue'
import LoginView from '../views/login.vue'

const routes = [
  {
    path: '/',
    component: HomeView,
    redirect: '/files/myFile',
    children: [
      {
        path: "files/:fileId",
        component: () => import("@/views/Files.vue")
      }
    ]
  },
  { path: '/login', component: LoginView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})


router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    next();
  } else {
    const token = localStorage.getItem('token');
    if (token) {
      next();
    } else {
      next('/login');
    }
  }
})

export default router;