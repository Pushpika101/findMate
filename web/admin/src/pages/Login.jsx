import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try{
      const res = await api.post('/auth/login', { email, password })
      if(res.data && res.data.success){
        const token = res.data.data.token
        // Ensure this user has admin privileges
        const user = res.data.data.user
        if (!user || !user.is_admin) {
          setError('Account does not have admin privileges')
          return
        }
        localStorage.setItem('token', token)
        navigate('/')
      } else {
        setError(res.data?.message || 'Login failed')
      }
    }catch(err){
      setError(err?.response?.data?.message || err.message || 'Login failed')
    }finally{ setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h2>Admin Login</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input autoComplete="username" value={email} onChange={(e)=>setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </div>
      </form>
    </div>
  )
}
