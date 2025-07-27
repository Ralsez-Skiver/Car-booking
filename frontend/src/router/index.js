import axios from 'axios'
import { createRouter, createWebHistory } from 'vue-router'
import AdminView from '@/views/AdminView.vue'
import InvoiceView from '@/views/InvoiceView.vue'
import RequesteeView from '@/views/RequesteeView.vue'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'

axios.defaults.withCredentials = true

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/requestee', name: 'Requestee', component: RequesteeView },
  { path: '/invoice', name: 'Invoice', component: InvoiceView },
  { path: '/admin', name: 'Admin', component: AdminView },
  { path: '/:catchAll(.*)', redirect: '/login' },
  ],
})

router.beforeEach(async (to, from, next) => {
  try {
    const res = await axios.get('http://localhost:3001/me')
    const role = res.data.role

    if (to.path === '/login') {
      if (role === 'Requestee') next('/requestee')
      else if (role === 'Invoice') next('/invoice')
      else if (role === 'Admin') next('/admin')
      else next() 
    } else if (to.path === '/') {
      if (role === 'Requestee') next('/requestee')
      else if (role === 'Invoice') next('/invoice')
      else if (role === 'Admin') next('/admin')
      else next()
    } else {
      next()
    }
  } catch {
    if (to.path !== '/login') next('/login')
    else next()
  }
})


export default router
