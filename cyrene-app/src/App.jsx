// App.jsx — Cyrene Technologies AI Bidding Agent
// We are using useState — a React tool that lets us track and change data
import { useState } from 'react'

function App() {

  // useState creates a variable that React watches for changes
  // When it changes, React automatically updates what you see on screen
  // tenders = the list of tenders (starts empty)
  // setTenders = the function to update that list
  const [tenders, setTenders] = useState([])

  // loading = true or false — tracks if we are searching
  const [loading, setLoading] = useState(false)

  // This function runs when the button is clicked
  function findTenders() {

    // Set loading to true — button will show "Searching..."
    setLoading(true)

    // Wait 2 seconds to simulate searching the ZPPA portal
    setTimeout(function() {

      // This is our fake tender data for now
      // Later we will replace this with REAL data from ZPPA
      const results = [
        {
          id: 1,
          icon: '💻',
          title: 'Supply of ICT Equipment',
          ministry: 'Ministry of Technology',
          deadline: '30 March 2026',
          value: 'K 1,200,000'
        },
        {
          id: 2,
          icon: '🖨️',
          title: 'Supply of Printers and Copiers',
          ministry: 'Ministry of Education',
          deadline: '5 April 2026',
          value: 'K 450,000'
        },
        {
          id: 3,
          icon: '🌐',
          title: 'Network Infrastructure Setup',
          ministry: 'Zambia Revenue Authority',
          deadline: '12 April 2026',
          value: 'K 2,800,000'
        }
      ]

      // Update the tenders list with our results
      setTenders(results)

      // Set loading back to false
      setLoading(false)

    }, 2000)
  }

  // This is what the user SEES — the JSX
  return (
    <div>

      {/* NAVBAR */}
      <div style={{
        backgroundColor: '#111827',
        padding: '20px 40px',
        borderBottom: '2px solid #00C896',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ color: '#00C896', fontSize: '22px', marginBottom: '4px' }}>
            Cyrene Technologies
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px' }}>
            AI Bidding Agent — ZPPA Government Tenders
          </p>
        </div>
        <span style={{ color: '#00C896', fontSize: '13px' }}>
          🟢 System Online
        </span>
      </div>

      {/* HERO */}
      <div style={{
        textAlign: 'center',
        padding: '80px 20px'
      }}>
        <h2 style={{ fontSize: '42px', color: '#F1F5F9', marginBottom: '16px' }}>
          Win More <span style={{ color: '#00C896' }}>Government Tenders</span> With AI
        </h2>
        <p style={{ fontSize: '18px', color: '#64748B', marginBottom: '40px' }}>
          Automatically find, prepare and submit ZPPA bids for Cyrene Technologies
        </p>

        {/* BUTTON — changes text based on loading state */}
        <button
          onClick={findTenders}
          style={{
            backgroundColor: loading ? '#00A87E' : '#00C896',
            color: '#0B0F1A',
            border: 'none',
            padding: '16px 40px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {loading ? '⏳ Searching ZPPA Portal...' : '🔍 Find Active Tenders'}
        </button>
      </div>

      {/* TENDER CARDS — only shows when tenders list is not empty */}
      {tenders.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          padding: '0 40px 60px',
          flexWrap: 'wrap'
        }}>
          {/* Loop through each tender and create a card */}
          {tenders.map(function(tender) {
            return (
              <div
                key={tender.id}
                style={{
                  backgroundColor: '#111827',
                  border: '1px solid #1E2A3A',
                  borderRadius: '12px',
                  padding: '28px',
                  width: '240px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                  {tender.icon}
                </div>
                <h3 style={{ color: '#00C896', marginBottom: '12px' }}>
                  {tender.title}
                </h3>
                <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '8px' }}>
                  <strong style={{ color: '#E2E8F0' }}>Ministry:</strong><br/>
                  {tender.ministry}
                </p>
                <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '8px' }}>
                  <strong style={{ color: '#E2E8F0' }}>Deadline:</strong><br/>
                  {tender.deadline}
                </p>
                <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '16px' }}>
                  <strong style={{ color: '#00C896' }}>Value:</strong><br/>
                  {tender.value}
                </p>
                <button style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #00C896',
                  color: '#00C896',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}>
                  Prepare Bid →
                </button>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
export default App

