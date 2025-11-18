import axios from 'axios'

// In dev, set VITE_API_BASE in web/admin/.env or your dev environment. Fallback to the LAN IP.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://172.20.10.3:5001/api'

const instance = axios.create({ baseURL: API_BASE })

// Attach token from localStorage if present
instance.interceptors.request.use((config)=>{
  const token = localStorage.getItem('token')
  if(token){
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default instance
