import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  withCredentials: true
})

// 공통 에러 메시지 추출기
function getErrorMessage(e) {
  const r = e?.response
  return (
    r?.data?.error ||
    r?.data?.message ||
    (typeof r?.data === 'string' ? r.data : '') ||
    e.message ||
    '요청 실패'
  )
}

// ── 요청 인터셉터: 토큰 첨부
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── 응답 인터셉터: 401 → refresh → 재시도
let isRefreshing = false
let subscribers = []
const onRefreshed = (token) => { subscribers.forEach(cb => cb(token)); subscribers = [] }
const addSubscriber = (cb) => subscribers.push(cb)

api.interceptors.response.use(
  res => res,
  async err => {
    const { config, response } = err
    if (!response) return Promise.reject(err)
    const isAuthPath = config.url?.includes('/auth/')
    if (response.status === 401 && !config._retry && !isAuthPath) {
      config._retry = true
      if (isRefreshing) {
        return new Promise(resolve => {
          addSubscriber((newToken) => {
            config.headers.Authorization = 'Bearer ' + newToken
            resolve(api(config))
          })
        })
      }
      isRefreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        localStorage.setItem('token', data.token)
        onRefreshed(data.token)
        config.headers.Authorization = 'Bearer ' + data.token
        return api(config)
      } catch (e) {
        localStorage.removeItem('token')
        router.push('/login')
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    // ❗여기서 그대로 reject하면 프론트에서 이유 파악이 어려우므로, 메시지 정리
    return Promise.reject(new Error(getErrorMessage(err)))
  }
)

// === 공개 API들 ===
// 중복 확인은 그대로
export const checkUsername = (loginId) =>
  api.get('/auth/check-username', { params: { loginId } }).then(r => r.data)

export const checkEmail = (email) =>
  api.get('/auth/check-email', { params: { email } }).then(r => r.data)

// ⭐ signup: 서버 에러문구를 Error로 던지기
export const signup = async (payload, verificationCode) => {
  try {
    const { data } = await api.post(
      `/auth/signup?verificationCode=${encodeURIComponent(String(verificationCode ?? ''))}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e))
  }
}

export const login = async (payload) => {
  try {
    const { data } = await api.post('/auth/login', payload)
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e))
  }
}

export const logout = () =>
  api.post('/auth/logout').then(r => r.data)

export const getMe = () =>
  api.get('/me').then(r => r.data)

// 이메일 인증
export const sendEmailCode = async (email) => {
  try {
    const { data } = await api.post('/auth/email/send', { email })
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e))
  }
}

export const verifyEmailCode = async (email, code) => {
  try {
    const { data } = await api.post('/auth/email/verify', { email, code })
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e))
  }
}

// ✅ 새 비밀번호 재설정
export const resetPassword = async (email, code, newPassword) => {
  try {
    const { data } = await api.post('/auth/reset-password', { email, code, newPassword })
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e))
  }
}

export default api
