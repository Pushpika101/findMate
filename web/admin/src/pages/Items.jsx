import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Items(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type: '', status: '' })

  const fetchItems = async () => {
    setLoading(true)
    try{
      const res = await api.get('/admin/items', { params: filter })
      if(res.data && res.data.success){
        setItems(res.data.data.items)
      }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{ fetchItems() }, [filter])

  const handleDelete = async (id) => {
    if(!confirm('Delete this item?')) return
    try{
      await api.delete(`/admin/items/${id}`)
      setItems((prev)=>prev.filter(i=>i.id !== id))
      alert('Item deleted')
    }catch(e){ alert('Failed to delete item') }
  }

  return (
    <div>
      <h1>Items</h1>
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

      {loading ? <div>Loading...</div> : (
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
                <td><button className="btn btn-danger" onClick={()=>handleDelete(i.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
