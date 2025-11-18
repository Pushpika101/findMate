import React from 'react'

export default function Logo({ className = '' }){
  // Prefer PNG icon copied from the mobile assets. Fallback to svg if png not present.
  const src = '/favicon.png'
  return (
    <img src={src} alt="findMate logo" className={className} />
  )
}
