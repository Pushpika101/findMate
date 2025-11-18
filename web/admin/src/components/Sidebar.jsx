import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'

export default function Sidebar({ onLogout }){
  const loc = useLocation()
  const active = (p) => loc.pathname === p

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo className="logo" />
          <div>
            <div className="brand-name">findMate</div>
            <div className="sidebar-sub">Admin</div>
          </div>
        </div>
      </div>

      <nav>
        <ul className="nav-list">
          <li className={active('/') ? 'active' : ''}><Link to="/">Dashboard</Link></li>
          {/* Users and Items moved into Dashboard view for unified management */}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-outline" onClick={onLogout}>Sign out</button>
      </div>
    </aside>
  )
}
