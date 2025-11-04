import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Dashboard(){
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await api.get('/admin/statistics')
        if(res.data && res.data.success){
          setStats(res.data.data)
        }
      }catch(e){
        console.error(e)
      }finally{
        setLoading(false)
      }
    })()
  },[])

  if(loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Dashboard</h1>
      {stats ? (
        <div className="grid">
          <div className="card">
            <h3>Users</h3>
            <p>Total: {stats.users.total}</p>
            <p>Verified: {stats.users.verified}</p>
          </div>
          <div className="card">
            <h3>Items</h3>
            <p>Total: {stats.items.total}</p>
            <p>Active: {stats.items.active}</p>
            <p>Resolved: {stats.items.resolved}</p>
          </div>
          <div className="card">
            <h3>Matches</h3>
            <p>Total: {stats.matches.total}</p>
          </div>
        </div>
      ) : (
        <div>No data</div>
      )}
    </div>
  )
}
