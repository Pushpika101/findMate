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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">Overview of active users, items and matches</div>
        </div>
        <div>
          {/* could add actions here */}
        </div>
      </div>

      {stats ? (
        <div className="cards">
          <div className="card">
            <h3>Users</h3>
            <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
              <div>
                <div className="stat-value">{stats.users.total}</div>
                <div style={{ color: 'var(--muted)', fontSize:13 }}>Total users</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color: 'var(--muted)', fontSize:13 }}>Verified</div>
                <div className="stat-value">{stats.users.verified}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Items</h3>
            <div style={{ display: 'flex', gap:12, marginTop:8 }}>
              <div style={{ flex:1 }}>
                <div className="stat-value">{stats.items.total}</div>
                <div style={{ color: 'var(--muted)', fontSize:13 }}>Total</div>
              </div>
              <div style={{ flex:1 }}>
                <div className="stat-value">{stats.items.active}</div>
                <div style={{ color: 'var(--muted)', fontSize:13 }}>Active</div>
              </div>
              <div style={{ flex:1 }}>
                <div className="stat-value">{stats.items.resolved}</div>
                <div style={{ color: 'var(--muted)', fontSize:13 }}>Resolved</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Matches</h3>
            <div style={{ marginTop:8 }}>
              <div className="stat-value">{stats.matches.total}</div>
              <div style={{ color: 'var(--muted)', fontSize:13 }}>Total matches</div>
            </div>
          </div>
        </div>
      ) : (
        <div>No data</div>
      )}
    </div>
  )
}
