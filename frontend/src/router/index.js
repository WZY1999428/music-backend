import { createWebHashHistory, createRouter } from 'vue-router'

import HomeView from '../views/index.vue'
import LoginView from '../views/login.vue'

const routes = [
  {
    path: '/',
    component: HomeView,
    redirect: '/files',
    children: [
      {
        path: "files",
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
  const token = localStorage.getItem('token');
  if (to.path === '/login') {
    if (token) next("/") 
    else next();
  } else {
    if (token) {
      next();
    } else {
      next('/login');
    }
  }
})



export default router;