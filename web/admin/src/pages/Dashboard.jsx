import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Dashboard(){
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Users section
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [search, setSearch] = useState('')

  // Items section
  const [items, setItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [filter, setFilter] = useState({ type: '', status: '' })

  useEffect(()=>{
    fetchStats()
    fetchUsers()
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStats = async () => {
    setLoadingStats(true)
    try{
      const res = await api.get('/admin/statistics')
      if(res.data && res.data.success){
        setStats(res.data.data)
      }
    }catch(e){ console.error(e) }
    setLoadingStats(false)
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try{
      const res = await api.get('/admin/users', { params: { search } })
      if(res.data && res.data.success){ setUsers(res.data.data.users) }
    }catch(e){ console.error(e) }
    setLoadingUsers(false)
  }

  const fetchItems = async () => {
    setLoadingItems(true)
    try{
      const res = await api.get('/admin/items', { params: filter })
      if(res.data && res.data.success){ setItems(res.data.data.items) }
    }catch(e){ console.error(e) }
    setLoadingItems(false)
  }

  const handleBan = async (id) => {
    if(!confirm('Ban/delete this user? This will remove their items.')) return
    try{
      await api.delete(`/admin/users/${id}`)
      setUsers((prev)=>prev.filter(u=>u.id !== id))
      alert('User banned')
    }catch(e){ alert('Failed to ban user') }
  }

  const handleForceLogout = async (id) => {
    if(!confirm('Force logout this user? This will disconnect their active sessions.')) return
    try{
      const res = await api.post(`/admin/users/${id}/logout`)
      if(res.data && res.data.success){ alert('User has been force-logged out') }
      else { alert('Failed to force logout user') }
    }catch(e){ console.error(e); alert('Failed to force logout user') }
  }

  const handleDeleteItem = async (id) => {
    if(!confirm('Delete this item?')) return
    try{
      await api.delete(`/admin/items/${id}`)
      setItems((prev)=>prev.filter(i=>i.id !== id))
      alert('Item deleted')
    }catch(e){ alert('Failed to delete item') }
  }

  if(loadingStats) return <div>Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">Overview of active users, items and matches</div>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => { fetchStats(); fetchUsers(); fetchItems(); }}>Refresh</button>
        </div>
      </div>

      {stats ? (
        <div className="cards">
          <div className="card">
            <h3>Users</h3>
            <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
              <div>
                <div className="stat-value">{stats.users.total}</div>
                <div className="stat-small">Total users</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="stat-small">Verified</div>
                <div className="badge badge-green">{stats.users.verified}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Items</h3>
            <div style={{ display: 'flex', gap:12, marginTop:8 }}>
              <div style={{ flex:1 }}>
                <div className="stat-value">{stats.items.total}</div>
                <div className="stat-small">Total</div>
              </div>
              <div style={{ flex:1 }}>
                <div className="stat-value">{stats.items.active}</div>
                <div className="stat-small">Active</div>
              </div>
              <div style={{ flex:1 }}>
                <div className="stat-value">{stats.items.resolved}</div>
                <div className="stat-small">Resolved</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Matches</h3>
            <div style={{ marginTop:8 }}>
              <div className="stat-value">{stats.matches.total}</div>
              <div className="stat-small">Total matches</div>
            </div>
          </div>
        </div>
      ) : (
        <div>No data</div>
      )}

      {/* Combined users & items lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
        <section className="card">
          <h3>Users</h3>
          <div style={{ marginBottom: 12 }}>
            <input placeholder="Search by name or email" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={fetchUsers}>Search</button>
          </div>

          {loadingUsers ? <div>Loading users...</div> : (
            <div style={{ maxHeight: 360, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Items</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.is_online ? <span className="badge badge-green">Online</span> : <span className="badge" style={{ background:'var(--muted)' }}>Offline</span>}</td>
                      <td>{u.total_items}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button title="Ban user" className="icon-btn" onClick={()=>handleBan(u.id)}>⛔</button>
                          <button title="Force logout" className="icon-btn" onClick={()=>handleForceLogout(u.id)}>🔌</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h3>Items</h3>
          <div style={{ marginBottom: 12 }}>
            <select onChange={(e)=>setFilter({...filter, type: e.target.value})} value={filter.type}>
              <option value="">All types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <select onChange={(e)=>setFilter({...filter, status: e.target.value})} value={filter.status}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
            <button className="btn btn-primary" onClick={fetchItems}>Refresh</button>
          </div>

          {loadingItems ? <div>Loading items...</div> : (
            <div style={{ maxHeight: 360, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Type</th><th>Status</th><th>User</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id}>
                      <td>{i.id}</td>
                      <td>{i.item_name}</td>
                      <td>{i.type === 'lost' ? <span className="badge badge-orange">Lost</span> : <span className="badge badge-blue">Found</span>}</td>
                      <td>{i.status === 'active' ? <span className="badge badge-green">Active</span> : <span className="badge" style={{ background:'var(--muted)' }}>Resolved</span>}</td>
                      <td>{i.user_name} ({i.user_email})</td>
                      <td><button className="btn btn-danger" onClick={()=>handleDeleteItem(i.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
