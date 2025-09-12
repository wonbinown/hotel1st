// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import SignupView from '@/views/SignupView.vue'
import LoginView from '@/views/LoginView.vue'
import MainView from '@/views/MainView.vue'
import FindPasswordView from '@/views/FindPasswordView.vue'

// 예약 관련
import ReservationPage from '@/views/reservation/ReservationPage.vue'

// ✅ 결제 결과 페이지 (SFC 만든 그대로 import)
import PaymentSuccess from '@/views/reservation/PaymentSuccess.vue'
import PaymentFail from '@/views/reservation/PaymentFail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/signup', component: SignupView },
    { path: '/login', component: LoginView },
    { path: '/find-password', component: FindPasswordView },
    { path: '/main', component: MainView, meta: { requiresAuth: true } },

    // 예약 플로우
    { path: '/reservation', component: ReservationPage },

    // ✅ 토스 결제 결과 콜백 라우트
    //    /pay/success?paymentKey=...&orderId=...&amount=...
    { path: '/pay/success', name: 'PaySuccess', component: PaymentSuccess },
    //    /pay/fail?message=...&code=...
    { path: '/pay/fail', name: 'PayFail', component: PaymentFail },

    { path: '/', redirect: '/main' },

    // ⚠️ 맨 마지막 404
    { path: '/:pathMatch(.*)*', redirect: '/main' }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

// (beforeEach 훅은 그대로 유지)
router.beforeEach((to, from, next) => {
  const hash = to.hash || window.location.hash
  const m = hash && hash.match(/token=([^&]+)/)
  const tokenFromHash = m ? decodeURIComponent(m[1]) : null
  const tokenFromQuery = to.query?.token

  if (tokenFromHash || tokenFromQuery) {
    const token = tokenFromHash || tokenFromQuery
    localStorage.setItem('token', token)
    window.history.replaceState({}, '', to.path)
  }

  const token = localStorage.getItem('token')

  // ✅ 결제 콜백 페이지는 로그인 없이 접근 가능해야 함
  const isPayCallback = to.path.startsWith('/pay/')
  if (!isPayCallback && to.meta.requiresAuth && !token) return next('/login')
  if (!isPayCallback && (to.path === '/login' || to.path === '/signup') && token) return next('/main')

  next()
})

export default router
