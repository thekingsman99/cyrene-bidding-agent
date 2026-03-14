import { useState } from 'react'
import ChatBot from './ChatBot'
import ManualTenderForm from './ManualTenderForm'

function App() {
  const [activePlatform, setActivePlatform] = useState('zppa')
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)
  const [savedBids, setSavedBids] = useState([])
  const [activeTab, setActiveTab] = useState('search')
  const [bidLoading, setBidLoading] = useState(false)

  async function findTenders() {
    setTenders([])
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/tenders/${activePlatform}`)
      const data = await response.json()
      setTenders(data.tenders)
    } catch (error) {
      alert('Could not connect to server. Make sure node server.cjs is running.')
    }
    setLoading(false)
  }

  async function prepareBid(tender) {
    setBidLoading(tender.id)
    try {
      const response = await fetch('http://localhost:3001/bids/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId: tender.id, platform: activePlatform })
      })
      const data = await response.json()
      setSelectedBid(data.bid)
      setActiveTab('bid')
    } catch (error) {
      alert('Error generating bid. Check server is running.')
    }
    setBidLoading(false)
  }

  async function loadSavedBids() {
    try {
      const response = await fetch('http://localhost:3001/bids')
      const data = await response.json()
      setSavedBids(data.bids)
    } catch (error) {
      alert('Could not load bids.')
    }
  }

  const color = activePlatform === 'zppa' ? '#00C896' : '#3B9EFF'

  const TABS = [
    { id: 'search', label: 'Find Tenders' },
    { id: 'manual', label: 'Add Real Tender' },
    { id: 'bid', label: 'Bid Document' },
    { id: 'saved', label: 'Saved Bids' },
    { id: 'ai', label: 'AI Consultant' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F1A' }}>

      {/* NAVBAR */}
      <div style={{
        backgroundColor: '#111827', padding: '16px 32px',
        borderBottom: '2px solid #00C896',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{ color: '#00C896', fontSize: '20px', marginBottom: '2px' }}>
            Cyrene Technologies
          </h1>
          <p style={{ color: '#64748B', fontSize: '12px' }}>
            AI Bidding Agent - ZPPA and UNGM
          </p>
        </div>
        <span style={{ color: '#00C896', fontSize: '13px' }}>System Online</span>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1E2A3A',
        padding: '0 32px', backgroundColor: '#111827'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'saved') loadSavedBids()
            }}
            style={{
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #00C896' : '2px solid transparent',
              color: activeTab === tab.id ? '#00C896' : '#64748B',
              padding: '14px 20px', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
            {['zppa', 'ungm'].map(platform => (
              <button
                key={platform}
                onClick={() => { setActivePlatform(platform); setTenders([]) }}
                style={{
                  padding: '10px 28px', borderRadius: '8px',
                  border: `2px solid ${activePlatform === platform ? color : '#1E2A3A'}`,
                  backgroundColor: activePlatform === platform ? `${color}20` : '#111827',
                  color: activePlatform === platform ? color : '#64748B',
                  fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {platform === 'zppa' ? 'ZPPA Tenders' : 'UNGM Tenders'}
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <button
              onClick={findTenders}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#1E2A3A' : color,
                color: loading ? '#64748B' : '#0B0F1A',
                border: 'none', padding: '14px 48px',
                fontSize: '15px', fontWeight: 'bold',
                borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Searching...' : `Find ${activePlatform.toUpperCase()} Tenders`}
            </button>
          </div>

          {tenders.length > 0 && (
            <div>
              <p style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>
                Found <strong style={{ color }}>{tenders.length} tenders</strong> matching Cyrene Technologies
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                {tenders.map(tender => (
                  <div key={tender.id} style={{
                    backgroundColor: '#111827', border: `1px solid ${color}30`,
                    borderRadius: '12px', padding: '20px', width: '280px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', marginBottom: '8px' }}>
                      {tender.id}
                    </div>
                    <h3 style={{ color, fontSize: '14px', marginBottom: '12px', lineHeight: '1.4' }}>
                      {tender.title}
                    </h3>
                    <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>
                      <strong style={{ color: '#E2E8F0' }}>Entity:</strong> {tender.ministry}
                    </p>
                    <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>
                      <strong style={{ color: '#E2E8F0' }}>Deadline:</strong> {tender.deadline}
                    </p>
                    <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>
                      <strong style={{ color }}>Value:</strong> {tender.currency} {tender.value.toLocaleString()}
                    </p>
                    <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '16px' }}>
                      <strong style={{ color: '#E2E8F0' }}>Requirements:</strong> {tender.requirements.join(', ')}
                    </p>
                    <button
                      onClick={() => prepareBid(tender)}
                      disabled={bidLoading === tender.id}
                      style={{
                        backgroundColor: bidLoading === tender.id ? '#1E2A3A' : 'transparent',
                        border: `1px solid ${color}`,
                        color: bidLoading === tender.id ? '#64748B' : color,
                        padding: '8px 16px', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '12px', width: '100%'
                      }}
                    >
                      {bidLoading === tender.id ? 'Generating...' : 'Prepare Bid'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL TENDER TAB */}
      {activeTab === 'manual' && (
        <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ color: '#F1F5F9', fontSize: '18px', marginBottom: '8px' }}>
            Add a Real Tender from ZPPA or UNGM
          </h2>
          <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '16px', lineHeight: '1.7' }}>
            Log in to eprocure.zppa.org.zm or ungm.org, find a tender,
            copy the details below and the AI will prepare your complete bid document.
          </p>
          <div style={{
            backgroundColor: '#111827', border: '1px solid #1E2A3A',
            borderRadius: '10px', padding: '16px 20px', marginBottom: '24px'
          }}>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '2' }}>
              <div>Step 1 — Go to eprocure.zppa.org.zm and log in with your credentials</div>
              <div>Step 2 — Find a tender you want to bid on</div>
              <div>Step 3 — Copy the tender details into the form below</div>
              <div>Step 4 — Click Generate and AI writes your complete bid in seconds</div>
            </div>
          </div>
          <ManualTenderForm onBidGenerated={(bid) => {
            setSelectedBid(bid)
            setActiveTab('bid')
          }} />
        </div>
      )}

      {/* BID DOCUMENT TAB */}
      {activeTab === 'bid' && (
        <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          {selectedBid ? (
            <div>
              <div style={{
                backgroundColor: '#111827', border: '1px solid #00C89640',
                borderRadius: '12px', padding: '24px', marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ color: '#00C896', fontSize: '18px', marginBottom: '4px' }}>
                      {selectedBid.tenderTitle}
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '13px' }}>{selectedBid.ministry}</p>
                  </div>
                  <div style={{
                    backgroundColor: '#00C89620', border: '1px solid #00C89640',
                    borderRadius: '8px', padding: '8px 16px', textAlign: 'center'
                  }}>
                    <div style={{ color: '#00C896', fontWeight: 'bold', fontSize: '14px' }}>
                      {selectedBid.currency} {Number(selectedBid.value).toLocaleString()}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '11px' }}>Bid Value</div>
                  </div>
                </div>
                <pre style={{
                  backgroundColor: '#0B0F1A', border: '1px solid #1E2A3A',
                  borderRadius: '8px', padding: '20px',
                  color: '#E2E8F0', fontSize: '13px',
                  lineHeight: '1.8', overflowX: 'auto', whiteSpace: 'pre-wrap'
                }}>
                  {selectedBid.document}
                </pre>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    const blob = new Blob([selectedBid.document], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${selectedBid.tenderId}_bid.txt`
                    a.click()
                  }}
                  style={{
                    backgroundColor: '#00C896', color: '#0B0F1A',
                    border: 'none', padding: '12px 24px',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 'bold'
                  }}
                >
                  Download Bid Document
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  style={{
                    backgroundColor: 'transparent', color: '#64748B',
                    border: '1px solid #1E2A3A', padding: '12px 24px',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Back to Search
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
              <p>No bid prepared yet. Go to Add Real Tender or Find Tenders to prepare a bid.</p>
            </div>
          )}
        </div>
      )}

      {/* SAVED BIDS TAB */}
      {activeTab === 'saved' && (
        <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ color: '#F1F5F9', fontSize: '18px', marginBottom: '20px' }}>
            Saved Bids ({savedBids.length})
          </h2>
          {savedBids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
              <p>No bids saved yet. Prepare a bid first.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedBids.map(bid => (
                <div key={bid.id} style={{
                  backgroundColor: '#111827', border: '1px solid #1E2A3A',
                  borderRadius: '10px', padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {bid.tenderTitle}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '12px' }}>
                      {bid.ministry} | Deadline: {bid.deadline}
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
                      {bid.tenderId}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#00C896', fontWeight: 'bold', fontSize: '14px' }}>
                      {bid.currency} {Number(bid.value).toLocaleString()}
                    </div>
                    <div style={{
                      backgroundColor: '#00C89620', color: '#00C896',
                      fontSize: '11px', padding: '2px 8px',
                      borderRadius: '20px', marginTop: '4px'
                    }}>
                      {bid.status}
                    </div>
                    <button
                      onClick={() => { setSelectedBid(bid); setActiveTab('bid') }}
                      style={{
                        marginTop: '8px', backgroundColor: 'transparent',
                        border: '1px solid #1E2A3A', color: '#64748B',
                        padding: '4px 12px', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '11px'
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI CONSULTANT TAB */}
      {activeTab === 'ai' && (
        <div style={{ paddingTop: '32px' }}>
          <ChatBot />
        </div>
      )}

    </div>
  )
}

export default App