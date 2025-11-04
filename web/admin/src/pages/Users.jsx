import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Users(){
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try{
      const res = await api.get('/admin/users', { params: { search } })
      if(res.data && res.data.success){
        setUsers(res.data.data.users)
      }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{ fetchUsers() }, [search])

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
      if(res.data && res.data.success){
        alert('User has been force-logged out')
      } else {
        alert('Failed to force logout user')
      }
    }catch(e){
      console.error(e)
      alert('Failed to force logout user')
    }
  }

  return (
    <div>
      <h1>Users</h1>
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Search by name or email" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <button onClick={fetchUsers}>Search</button>
      </div>
      {loading ? <div>Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Admin</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {u.is_online ? (
                    <span className="badge badge-green">Online</span>
                    ) : (
                    <span className="badge" style={{ background:'var(--muted)' }}>Offline</span>
                  )}
                </td>
                <td>{String(u.is_verified)}</td>
                <td>{String(u.is_admin)}</td>
                <td>{u.total_items}</td>
                <td>
                  <button className="btn btn-outline" onClick={()=>handleBan(u.id)} style={{ marginRight:8 }}>Ban</button>
                  <button className="btn btn-primary" onClick={()=>handleForceLogout(u.id)}>Force logout</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
