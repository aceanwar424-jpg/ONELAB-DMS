import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login')) {
        window.location.href = '/ONELAB-DMS/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
export { API_URL }
