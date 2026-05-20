import { useState } from 'react'
import Dashboard from './components/Dashboard'

function App() {
  const [submissions] = useState([])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ 
        background: '#5B4FFF', 
        color: 'white', 
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>
          📊 Customer Advocacy App
        </h1>
        <p style={{ marginTop: '8px', opacity: 0.9 }}>
          Week 1 of 6 • May 20, 2026
        </p>
      </header>

      <main style={{ paddingTop: '20px' }}>
        <Dashboard submissions={submissions} />
      </main>
    </div>
  )
}

export default App
