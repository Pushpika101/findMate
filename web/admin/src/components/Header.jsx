import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Header({ onLogout }){
  const userName = (() => {
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u?.name || null } catch(e){ return null }
  })()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" aria-label="Toggle sidebar">☰</button>
        <Link to="/" className="brand">
          <Logo className="logo" />
          <span className="brand-name">findMate Admin</span>
        </Link>
      </div>

      <div className="topbar-right">
        {userName ? <div className="user-info">{userName}</div> : null}
        <button className="btn btn-outline" onClick={onLogout}>Logout</button>
      </div>
    </header>
  )
}
