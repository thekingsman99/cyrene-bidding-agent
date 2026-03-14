import ChatBot from './ChatBot'
import { useState } from 'react'

function App() {

  // Track which platform tab is active — 'zppa' or 'ungm'
  const [activePlatform, setActivePlatform] = useState('zppa')

  // Tender results list — starts empty
  const [tenders, setTenders] = useState([])

  // Loading state — true while searching
  const [loading, setLoading] = useState(false)

  // Fake ZPPA tenders
  const zppaTenders = [
    {
      id: 1,
      icon: '💻',
      title: 'Supply of ICT Equipment',
      ministry: 'Ministry of Technology',
      deadline: '30 March 2026',
      value: 'K 1,200,000',
      ref: 'ZPPA/OPEN/ICT/2026/001'
    },
    {
      id: 2,
      icon: '🖨️',
      title: 'Supply of Printers and Copiers',
      ministry: 'Ministry of Education',
      deadline: '5 April 2026',
      value: 'K 450,000',
      ref: 'ZPPA/OPEN/ICT/2026/002'
    },
    {
      id: 3,
      icon: '🌐',
      title: 'Network Infrastructure Setup',
      ministry: 'Zambia Revenue Authority',
      deadline: '12 April 2026',
      value: 'K 2,800,000',
      ref: 'ZPPA/OPEN/ICT/2026/003'
    },
    {
      id: 4,
      icon: '🖥️',
      title: 'Supply of Server Infrastructure',
      ministry: 'Bank of Zambia',
      deadline: '18 April 2026',
      value: 'K 4,500,000',
      ref: 'ZPPA/OPEN/ICT/2026/004'
    }
  ]

  // Fake UNGM tenders
  const ungmTenders = [
    {
      id: 1,
      icon: '🌍',
      title: 'Supply of Laptops and Accessories',
      ministry: 'UNDP Zambia',
      deadline: '2 April 2026',
      value: '$ 85,000',
      ref: 'UNDP-ZMB-2026-001'
    },
    {
      id: 2,
      icon: '📡',
      title: 'ICT Network Equipment Supply',
      ministry: 'UNICEF Zambia',
      deadline: '8 April 2026',
      value: '$ 120,000',
      ref: 'UNICEF-ZMB-2026-014'
    },
    {
      id: 3,
      icon: '🏥',
      title: 'Health IT Systems Supply',
      ministry: 'WHO Zambia',
      deadline: '15 April 2026',
      value: '$ 200,000',
      ref: 'WHO-ZMB-2026-007'
    },
    {
      id: 4,
      icon: '🍱',
      title: 'Supply of Computer Equipment',
      ministry: 'WFP Zambia',
      deadline: '20 April 2026',
      value: '$ 95,000',
      ref: 'WFP-ZMB-2026-003'
    }
  ]

  // This function runs when Find Tenders button is clicked
  function findTenders() {

    // Clear previous results
    setTenders([])

    // Start loading
    setLoading(true)

    // Simulate searching the portal for 2 seconds
    setTimeout(function() {

      // Show tenders based on which tab is active
      if (activePlatform === 'zppa') {
        setTenders(zppaTenders)
      } else {
        setTenders(ungmTenders)
      }

      // Stop loading
      setLoading(false)

    }, 2000)
  }

  return (
    <div>

      {/* ===== NAVBAR ===== */}
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
            AI Bidding Agent — ZPPA & UNGM Government Tenders
          </p>
        </div>
        <span style={{ color: '#00C896', fontSize: '13px' }}>
          🟢 System Online
        </span>
      </div>

      {/* ===== HERO ===== */}
      <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <h2 style={{ fontSize: '38px', color: '#F1F5F9', marginBottom: '12px' }}>
          Win More <span style={{ color: '#00C896' }}>Government Tenders</span> With AI
        </h2>
        <p style={{ fontSize: '16px', color: '#64748B' }}>
          Search tenders from ZPPA (Zambia) and UNGM (United Nations) in one place
        </p>
      </div>

      {/* ===== PLATFORM TABS ===== */}
      {/* These tabs let you switch between ZPPA and UNGM */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '32px'
      }}>

        {/* ZPPA Tab */}
        <button
          onClick={() => {
            setActivePlatform('zppa')
            setTenders([])
          }}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: activePlatform === 'zppa' ? '2px solid #00C896' : '2px solid #1E2A3A',
            backgroundColor: activePlatform === 'zppa' ? '#00C89620' : '#111827',
            color: activePlatform === 'zppa' ? '#00C896' : '#64748B',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🇿🇲 ZPPA Tenders
        </button>

        {/* UNGM Tab */}
        <button
          onClick={() => {
            setActivePlatform('ungm')
            setTenders([])
          }}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: activePlatform === 'ungm' ? '2px solid #3B9EFF' : '2px solid #1E2A3A',
            backgroundColor: activePlatform === 'ungm' ? '#3B9EFF20' : '#111827',
            color: activePlatform === 'ungm' ? '#3B9EFF' : '#64748B',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🌍 UNGM Tenders
        </button>

      </div>

      {/* ===== PLATFORM INFO BOX ===== */}
      {/* Shows info about whichever platform is selected */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 32px',
        backgroundColor: '#111827',
        border: `1px solid ${activePlatform === 'zppa' ? '#00C89640' : '#3B9EFF40'}`,
        borderRadius: '10px',
        padding: '16px 24px',
        textAlign: 'center'
      }}>
        {activePlatform === 'zppa' ? (
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            🇿🇲 <strong style={{ color: '#00C896' }}>ZPPA e-GP Portal</strong> — 
            Zambian government tenders in Kwacha. 
            Visit: <span style={{ color: '#00C896' }}>eprocure.zppa.org.zm</span>
          </p>
        ) : (
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            🌍 <strong style={{ color: '#3B9EFF' }}>UNGM Portal</strong> — 
            United Nations tenders in USD. 
            Visit: <span style={{ color: '#3B9EFF' }}>ungm.org</span> | 
            Registration: <span style={{ color: '#F59E0B' }}>Required before bidding</span>
          </p>
        )}
      </div>

      {/* ===== SEARCH BUTTON ===== */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <button
          onClick={findTenders}
          style={{
            backgroundColor: loading
              ? '#1E2A3A'
              : activePlatform === 'zppa' ? '#00C896' : '#3B9EFF',
            color: loading ? '#64748B' : '#0B0F1A',
            border: 'none',
            padding: '16px 48px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading
            ? `⏳ Searching ${activePlatform === 'zppa' ? 'ZPPA' : 'UNGM'} Portal...`
            : `🔍 Find ${activePlatform === 'zppa' ? 'ZPPA' : 'UNGM'} Tenders`
          }
        </button>
      </div>

      {/* ===== TENDER RESULTS ===== */}
      {/* Only shows when tenders list has items */}
      {tenders.length > 0 && (
        <div>

          {/* Results count heading */}
          <p style={{
            textAlign: 'center',
            color: '#64748B',
            fontSize: '13px',
            marginBottom: '24px'
          }}>
            Found <strong style={{ color: activePlatform === 'zppa' ? '#00C896' : '#3B9EFF' }}>
              {tenders.length} tenders
            </strong> matching Cyrene Technologies profile
          </p>

          {/* Cards grid */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            padding: '0 40px 60px',
            flexWrap: 'wrap'
          }}>
            {tenders.map(function(tender) {
              return (
                <div
                  key={tender.id}
                  style={{
                    backgroundColor: '#111827',
                    border: `1px solid ${activePlatform === 'zppa' ? '#00C89630' : '#3B9EFF30'}`,
                    borderRadius: '12px',
                    padding: '24px',
                    width: '260px',
                    textAlign: 'center'
                  }}
                >
                  {/* Icon */}
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                    {tender.icon}
                  </div>

                  {/* Tender title */}
                  <h3 style={{
                    color: activePlatform === 'zppa' ? '#00C896' : '#3B9EFF',
                    marginBottom: '16px',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {tender.title}
                  </h3>

                  {/* Reference number */}
                  <p style={{
                    color: '#475569',
                    fontSize: '11px',
                    marginBottom: '12px',
                    fontFamily: 'monospace'
                  }}>
                    {tender.ref}
                  </p>

                  {/* Ministry */}
                  <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '6px' }}>
                    <strong style={{ color: '#E2E8F0' }}>Entity:</strong> {tender.ministry}
                  </p>

                  {/* Deadline */}
                  <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '6px' }}>
                    <strong style={{ color: '#E2E8F0' }}>Deadline:</strong> {tender.deadline}
                  </p>

                  {/* Value */}
                  <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '20px' }}>
                    <strong style={{
                      color: activePlatform === 'zppa' ? '#00C896' : '#3B9EFF'
                    }}>
                      Value:
                    </strong> {tender.value}
                  </p>

                  {/* Prepare Bid button */}
                  <button style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${activePlatform === 'zppa' ? '#00C896' : '#3B9EFF'}`,
                    color: activePlatform === 'zppa' ? '#00C896' : '#3B9EFF',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    width: '100%'
                  }}>
                    Prepare Bid →
                  </button>

                </div>
              )
            })}
          </div>
        </div>
      )}
{/* AI CONSULTANT CHAT */}
<div style={{ borderTop: '1px solid #1E2A3A', paddingTop: '40px', marginTop: '20px' }}>
  <ChatBot />
</div>
    </div>
  )
}

export default App
