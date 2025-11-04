import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Items from './pages/Items'

export default function App(){
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
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/users" element={<Users/>} />
          <Route path="/items" element={<Items/>} />
        </Routes>
      </main>
    </div>
  )
}
