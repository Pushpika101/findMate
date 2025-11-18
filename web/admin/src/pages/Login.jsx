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
        // Store token then verify /auth/me to refresh user and confirm admin status
        localStorage.setItem('token', token)
        try {
          const me = await api.get('/auth/me')
          const meUser = me?.data?.data?.user
          if (!meUser || !meUser.is_admin) {
            // Not an admin — clear token and show error
            localStorage.removeItem('token')
            setError('Account does not have admin privileges')
            return
          }
          try { localStorage.setItem('user', JSON.stringify(meUser)) } catch(e){}
          navigate('/')
        } catch (err) {
          localStorage.removeItem('token')
          setError('Failed to verify user. Please try again.')
          return
        }
      } else {
        setError(res.data?.message || 'Login failed')
      }
    }catch(err){
      setError(err?.response?.data?.message || err.message || 'Login failed')
    }finally{ setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-dot" />
          <div>
            <div className="brand-name">findMate Admin</div>
            <div className="page-sub">Manage users, items & matches</div>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label className="label">Email</label>
          <input autoComplete="username" value={email} onChange={(e)=>setEmail(e.target.value)} className="input" />

          <label className="label">Password</label>
          <input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} className="input" />

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <button type="button" className="btn btn-outline" onClick={()=>{ setEmail(''); setPassword('') }}>Clear</button>
          </div>
        </form>

        <div className="login-foot">Need help? Contact the maintainer.</div>
      </div>
    </div>
  )
}
