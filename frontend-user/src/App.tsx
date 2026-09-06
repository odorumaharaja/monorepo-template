import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [apiResponse, setApiResponse] = useState<string>('Loading...')

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api/user'
    fetch(`${apiUrl}/`)
      .then(res => res.json())
      .then(data => setApiResponse(JSON.stringify(data)))
      .catch(err => setApiResponse(`Error: ${err.message}`))
  }, [])

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>User Dashboard</h1>
          <p>
            Connected to API: <code>{import.meta.env.VITE_API_URL}</code>
          </p>
          <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Backend Response:</h2>
            <pre>{apiResponse}</pre>
          </div>
        </div>
      </section>
    </>
  )
}

export default App
