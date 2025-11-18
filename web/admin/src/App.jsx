import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Items from './pages/Items'
import Login from './pages/Login'
import { Navigate } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

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
      <Sidebar onLogout={handleLogout} />

      <div className="content-area">
        <Header onLogout={handleLogout} />

        <main className="main">
          <Routes>
            <Route path="/login" element={<Login/>} />
            <Route path="/" element={<Protected><Dashboard/></Protected>} />
            <Route path="/users" element={<Protected><Users/></Protected>} />
            <Route path="/items" element={<Protected><Items/></Protected>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
