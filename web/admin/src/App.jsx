import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Items from './pages/Items'
import Login from './pages/Login'
import { Navigate } from 'react-router-dom'

export default function App(){
  const Protected = ({ children }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return <Navigate to="/login" replace />;
    return children;
  }

  const handleLogout = () => {
    try { localStorage.removeItem('token'); } catch(e){}
    // reload to reset app state
    window.location.href = '/login';
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>findMate Admin</h2>
        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/users">Users</Link></li>
            <li><Link to="/items">Items</Link></li>
          </ul>
        </nav>
        <div style={{ marginTop: 20 }}>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/" element={<Protected><Dashboard/></Protected>} />
          <Route path="/users" element={<Protected><Users/></Protected>} />
          <Route path="/items" element={<Protected><Items/></Protected>} />
        </Routes>
      </main>
    </div>
  )
}
