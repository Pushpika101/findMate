import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api'

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
