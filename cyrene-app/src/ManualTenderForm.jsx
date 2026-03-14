// ManualTenderForm.jsx
// Phase 1: Manual input (you copy tender details, AI generates bid)
// Phase 2: After 4 wins, set AUTOMATION_ENABLED = true to unlock auto-search
import { useState } from 'react'

// ============================================
// AUTOMATION SWITCH — flip to true after 4 wins
const AUTOMATION_ENABLED = false
const WINS_REQUIRED = 4
// ============================================

const COMPANY = {
  name: 'Cyrene Technologies Limited',
  director: 'Andrew Mwape',
  location: 'Lusaka, Zambia',
  tpin: '1003456789',
  pacra: '120240012345',
  email: 'info@cyrenetechnologies.co.zm',
  phone: '+260 977 123 456',
  speciality: 'ICT Equipment Supply, Networking, Computers, Servers'
}

function ManualTenderForm({ onBidGenerated }) {
  const [form, setForm] = useState({
    platform: 'zppa',
    ref: '',
    title: '',
    entity: '',
    deadline: '',
    value: '',
    currency: 'ZMW',
    requirements: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [wins, setWins] = useState(
    parseInt(localStorage.getItem('cyrene_wins') || '0')
  )
  const [error, setError] = useState('')

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validateForm() {
    if (!form.ref) return 'Tender reference number is required'
    if (!form.title) return 'Tender title is required'
    if (!form.entity) return 'Procuring entity is required'
    if (!form.deadline) return 'Deadline is required'
    return null
  }

  async function generateBid() {
    const err = validateForm()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    try {
      // Call Claude AI to generate the full bid document
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `You are a professional procurement bid writer for ${COMPANY.name}, 
a Zambian ICT company. Generate complete, professional bid documents 
following ZPPA and UNGM standards. Always use the company details provided.
Company: ${JSON.stringify(COMPANY)}`,
          messages: [{
            role: 'user',
            content: `Generate a complete professional bid document for this tender:

Tender Reference: ${form.ref}
Title: ${form.title}
Procuring Entity: ${form.entity}
Deadline: ${form.deadline}
Value: ${form.currency} ${form.value || 'As per BOQ'}
Platform: ${form.platform.toUpperCase()}
Requirements: ${form.requirements || 'Standard ZPPA requirements'}
Description: ${form.description || 'Supply of ICT equipment and services'}

Generate a complete bid with:
1. Cover Letter
2. Company Profile
3. Technical Proposal
4. Compliance Checklist
5. Declaration

Format it professionally ready for submission.`
          }]
        })
      })

      const data = await response.json()
      const document = data.content[0].text

      // Create bid object
      const bid = {
        id: Date.now(),
        tenderId: form.ref,
        tenderTitle: form.title,
        ministry: form.entity,
        platform: form.platform.toUpperCase(),
        value: form.value || 0,
        currency: form.currency,
        deadline: form.deadline,
        status: 'PREPARED',
        preparedAt: new Date().toISOString(),
        document: document,
        // Automation hook — stores form data for future auto-submission
        _automationData: {
          enabled: AUTOMATION_ENABLED,
          winsRequired: WINS_REQUIRED,
          currentWins: wins,
          readyForAutomation: wins >= WINS_REQUIRED,
          formData: form
        }
      }

      // Save to server
      await fetch('http://localhost:3001/bids/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId: form.ref,
          platform: form.platform,
          manualData: form
        })
      }).catch(() => {})

      onBidGenerated(bid)

    } catch (error) {
      setError('Error generating bid. Check your internet connection.')
    }
    setLoading(false)
  }

  // Progress to automation
  const progressPercent = Math.min((wins / WINS_REQUIRED) * 100, 100)

  return (
    <div>

      {/* Automation progress tracker */}
      <div style={{
        backgroundColor: '#111827',
        border: `1px solid ${wins >= WINS_REQUIRED ? '#00C896' : '#1E2A3A'}`,
        borderRadius: '10px', padding: '16px 20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: 'bold' }}>
            🏆 Progress to Full Automation
          </span>
          <span style={{ color: '#00C896', fontSize: '13px' }}>
            {wins}/{WINS_REQUIRED} wins
          </span>
        </div>
        <div style={{ height: '6px', backgroundColor: '#1E2A3A', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPercent}%`, height: '100%',
            background: 'linear-gradient(90deg, #00C896, #3B9EFF)',
            borderRadius: '3px', transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
          {wins >= WINS_REQUIRED
            ? '✅ Ready for automation! Contact your engineer to enable.'
            : `Win ${WINS_REQUIRED - wins} more contract${WINS_REQUIRED - wins > 1 ? 's' : ''} to unlock full browser automation`
          }
        </div>

        {/* Win counter buttons for testing */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => {
              const newWins = wins + 1
              setWins(newWins)
              localStorage.setItem('cyrene_wins', newWins)
            }}
            style={{
              backgroundColor: 'transparent', border: '1px solid #00C896',
              color: '#00C896', padding: '4px 12px', borderRadius: '6px',
              cursor: 'pointer', fontSize: '11px'
            }}
          >
            + Record a Win
          </button>
          {wins > 0 && (
            <button
              onClick={() => {
                const newWins = wins - 1
                setWins(newWins)
                localStorage.setItem('cyrene_wins', newWins)
              }}
              style={{
                backgroundColor: 'transparent', border: '1px solid #475569',
                color: '#475569', padding: '4px 12px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '11px'
              }}
            >
              - Remove Win
            </button>
          )}
        </div>
      </div>

      {/* Platform selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['zppa', 'ungm'].map(p => (
          <button
            key={p}
            onClick={() => handleChange('platform', p)}
            style={{
              padding: '8px 20px', borderRadius: '6px',
              border: `1px solid ${form.platform === p ? (p === 'zppa' ? '#00C896' : '#3B9EFF') : '#1E2A3A'}`,
              backgroundColor: form.platform === p
                ? (p === 'zppa' ? '#00C89620' : '#3B9EFF20')
                : 'transparent',
              color: form.platform === p
                ? (p === 'zppa' ? '#00C896' : '#3B9EFF')
                : '#64748B',
              cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
            }}
          >
            {p === 'zppa' ? '🇿🇲 ZPPA' : '🌍 UNGM'}
          </button>
        ))}
      </div>

      {/* Form fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              Tender Reference Number *
            </label>
            <input
              value={form.ref}
              onChange={e => handleChange('ref', e.target.value)}
              placeholder="e.g. ZPPA/OPEN/ICT/2026/001"
              style={{
                width: '100%', backgroundColor: '#111827',
                border: '1px solid #1E2A3A', borderRadius: '6px',
                padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              Deadline *
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => handleChange('deadline', e.target.value)}
              style={{
                width: '100%', backgroundColor: '#111827',
                border: '1px solid #1E2A3A', borderRadius: '6px',
                padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Tender title */}
        <div>
          <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Tender Title *
          </label>
          <input
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="e.g. Supply and Delivery of ICT Equipment"
            style={{
              width: '100%', backgroundColor: '#111827',
              border: '1px solid #1E2A3A', borderRadius: '6px',
              padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Procuring entity */}
        <div>
          <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Procuring Entity (Ministry/Organization) *
          </label>
          <input
            value={form.entity}
            onChange={e => handleChange('entity', e.target.value)}
            placeholder="e.g. Ministry of Technology and Science"
            style={{
              width: '100%', backgroundColor: '#111827',
              border: '1px solid #1E2A3A', borderRadius: '6px',
              padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Value and currency */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
          <div>
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              Currency
            </label>
            <select
              value={form.currency}
              onChange={e => handleChange('currency', e.target.value)}
              style={{
                width: '100%', backgroundColor: '#111827',
                border: '1px solid #1E2A3A', borderRadius: '6px',
                padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="ZMW">ZMW (K)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              Estimated Value (optional)
            </label>
            <input
              value={form.value}
              onChange={e => handleChange('value', e.target.value)}
              placeholder="e.g. 1200000"
              style={{
                width: '100%', backgroundColor: '#111827',
                border: '1px solid #1E2A3A', borderRadius: '6px',
                padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Tender Requirements (copy from tender document)
          </label>
          <input
            value={form.requirements}
            onChange={e => handleChange('requirements', e.target.value)}
            placeholder="e.g. PACRA, TCC, TPIN, Bank Guarantee, Technical Proposal"
            style={{
              width: '100%', backgroundColor: '#111827',
              border: '1px solid #1E2A3A', borderRadius: '6px',
              padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Tender Description (paste from tender document — more detail = better bid)
          </label>
          <textarea
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Paste the tender description or scope of work here..."
            rows={4}
            style={{
              width: '100%', backgroundColor: '#111827',
              border: '1px solid #1E2A3A', borderRadius: '6px',
              padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#FF000015', border: '1px solid #FF000040',
            borderRadius: '6px', padding: '10px 14px',
            color: '#FF6B6B', fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={generateBid}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#1E2A3A' : '#00C896',
            color: loading ? '#64748B' : '#0B0F1A',
            border: 'none', padding: '14px 32px',
            borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px', fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {loading ? '⏳ AI is generating your bid...' : '🤖 Generate Bid Document with AI'}
        </button>

        <p style={{ color: '#475569', fontSize: '12px', textAlign: 'center' }}>
          The AI will generate a complete professional bid document using your company profile and the tender details above
        </p>

      </div>
    </div>
  )
}

export default ManualTenderForm