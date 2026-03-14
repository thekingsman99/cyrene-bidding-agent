import TenderZipUploader from './TenderZipUploader'
import { useState } from 'react'

const AUTOMATION_ENABLED = false
const WINS_REQUIRED = 4

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

const CERTIFICATE_TYPES = [
  { id: 'pacra', label: 'PACRA Certificate', required: true },
  { id: 'tcc', label: 'Tax Compliance Certificate (TCC)', required: true },
  { id: 'tpin', label: 'TPIN Certificate', required: true },
  { id: 'vat', label: 'VAT Registration Certificate', required: false },
  { id: 'nrc', label: 'NRC of Director', required: true },
  { id: 'audited', label: 'Audited Financial Statements', required: false },
  { id: 'bank', label: 'Bank Reference Letter', required: false },
  { id: 'guarantee', label: 'Bank Guarantee / Bid Bond', required: false },
  { id: 'manufacturer', label: 'Manufacturer Authorization Letters', required: false },
  { id: 'profile', label: 'Company Profile', required: false },
]

function ManualTenderForm({ onBidGenerated }) {
  const [step, setStep] = useState(1)
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
  const [uploadedDocs, setUploadedDocs] = useState({})
  const [docContents, setDocContents] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wins, setWins] = useState(
    parseInt(localStorage.getItem('cyrene_wins') || '0')
  )

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleFileUpload(certId, file) {
    if (!file) return
    setUploadedDocs(prev => ({ ...prev, [certId]: file.name }))

    // Read file content for text files
    const reader = new FileReader()
    reader.onload = (e) => {
      setDocContents(prev => ({
        ...prev,
        [certId]: `[${certId.toUpperCase()} - ${file.name}] File uploaded successfully`
      }))
    }
    reader.readAsText(file)
  }

  function validateStep1() {
    if (!form.ref) return 'Tender reference number is required'
    if (!form.title) return 'Tender title is required'
    if (!form.entity) return 'Procuring entity is required'
    if (!form.deadline) return 'Deadline is required'
    return null
  }

  function getUploadedCount() {
    return Object.keys(uploadedDocs).length
  }

  function getRequiredCount() {
    return CERTIFICATE_TYPES.filter(c => c.required).length
  }

  function getRequiredUploaded() {
    return CERTIFICATE_TYPES.filter(c => c.required && uploadedDocs[c.id]).length
  }

  async function generateBid() {
    setLoading(true)
    setError('')

    try {
      // Build document summary for AI
      const uploadedSummary = Object.entries(uploadedDocs)
        .map(([id, name]) => {
          const cert = CERTIFICATE_TYPES.find(c => c.id === id)
          return `- ${cert?.label || id}: ${name} (UPLOADED)`
        }).join('\n')

      const missingRequired = CERTIFICATE_TYPES
        .filter(c => c.required && !uploadedDocs[c.id])
        .map(c => `- ${c.label}: MISSING`)
        .join('\n')

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
          max_tokens: 3000,
          system: `You are a professional procurement bid writer for ${COMPANY.name}, 
a Zambian ICT company. Generate complete professional bid documents following 
ZPPA and UNGM standards. Company details: ${JSON.stringify(COMPANY)}`,
          messages: [{
            role: 'user',
            content: `Generate a complete professional bid document for this tender:

TENDER DETAILS:
Reference: ${form.ref}
Title: ${form.title}
Procuring Entity: ${form.entity}
Deadline: ${form.deadline}
Value: ${form.currency} ${form.value || 'As per BOQ'}
Platform: ${form.platform.toUpperCase()}
Requirements: ${form.requirements || 'Standard ZPPA requirements'}
Description: ${form.description || 'Supply of ICT equipment and services'}

COMPLIANCE DOCUMENTS STATUS:
Uploaded Documents:
${uploadedSummary || 'None uploaded yet'}

${missingRequired ? `Missing Required Documents:\n${missingRequired}` : 'All required documents uploaded!'}

Please generate a complete bid with these sections:
1. BID COVER LETTER (professional, signed by ${COMPANY.director})
2. COMPANY PROFILE (Cyrene Technologies background and experience)
3. TECHNICAL PROPOSAL (how we will deliver the tender requirements)
4. FINANCIAL PROPOSAL (pricing structure)
5. COMPLIANCE DOCUMENTS CHECKLIST (list all uploaded docs as attached, flag missing ones with action needed)
6. DECLARATION (signed declaration)

For each uploaded document, include it in the compliance checklist as ATTACHED.
For missing required documents, add a WARNING note.
Make the document professional and ready for ZPPA submission.`
          }]
        })
      })

      const data = await response.json()
      const document = data.content[0].text

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
        uploadedDocs: uploadedDocs,
        automationReady: wins >= WINS_REQUIRED
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

    } catch (err) {
      setError('Error generating bid. Check your internet connection.')
    }
    setLoading(false)
  }

  const progressPercent = Math.min((wins / WINS_REQUIRED) * 100, 100)

  return (
    <div>

      {/* Automation progress */}
      <div style={{
        backgroundColor: '#111827',
        border: `1px solid ${wins >= WINS_REQUIRED ? '#00C896' : '#1E2A3A'}`,
        borderRadius: '10px', padding: '14px 20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: 'bold' }}>
            Progress to Full Automation
          </span>
          <span style={{ color: '#00C896', fontSize: '13px' }}>
            {wins}/{WINS_REQUIRED} wins
          </span>
        </div>
        <div style={{ height: '5px', backgroundColor: '#1E2A3A', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{
            width: `${progressPercent}%`, height: '100%',
            background: 'linear-gradient(90deg, #00C896, #3B9EFF)',
            borderRadius: '3px', transition: 'width 0.5s'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            {wins >= WINS_REQUIRED
              ? 'Ready for automation! Contact engineer to enable.'
              : `Win ${WINS_REQUIRED - wins} more contract${WINS_REQUIRED - wins > 1 ? 's' : ''} to unlock full browser automation`}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => { const n = wins + 1; setWins(n); localStorage.setItem('cyrene_wins', n) }}
              style={{
                backgroundColor: 'transparent', border: '1px solid #00C896',
                color: '#00C896', padding: '3px 10px', borderRadius: '4px',
                cursor: 'pointer', fontSize: '11px'
              }}
            >+ Win</button>
            {wins > 0 && (
              <button
                onClick={() => { const n = wins - 1; setWins(n); localStorage.setItem('cyrene_wins', n) }}
                style={{
                  backgroundColor: 'transparent', border: '1px solid #475569',
                  color: '#475569', padding: '3px 10px', borderRadius: '4px',
                  cursor: 'pointer', fontSize: '11px'
                }}
              >- Win</button>
            )}
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { n: 1, label: 'Tender Details' },
          { n: 2, label: 'Upload Documents' },
          { n: 3, label: 'Generate Bid' }
        ].map(s => (
          <div
            key={s.n}
            onClick={() => {
              if (s.n === 2 && validateStep1()) return
              setStep(s.n)
            }}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', textAlign: 'center',
              backgroundColor: step === s.n ? '#00C89620' : '#111827',
              border: `1px solid ${step === s.n ? '#00C896' : '#1E2A3A'}`,
              cursor: 'pointer'
            }}
          >
            <div style={{ color: step === s.n ? '#00C896' : '#475569', fontSize: '16px', fontWeight: 'bold' }}>
              {s.n}
            </div>
            <div style={{ color: step === s.n ? '#E2E8F0' : '#475569', fontSize: '11px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
{/* ZIP UPLOADER — auto fills form */}
{step === 1 && (
  <TenderZipUploader onTenderExtracted={(data, files) => {
    if (data.ref) setForm(prev => ({ ...prev, ...data }))
  }} />
)}
      {/* STEP 1 — Tender Details */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Platform */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {['zppa', 'ungm'].map(p => (
              <button
                key={p}
                onClick={() => handleChange('platform', p)}
                style={{
                  padding: '8px 20px', borderRadius: '6px',
                  border: `1px solid ${form.platform === p ? (p === 'zppa' ? '#00C896' : '#3B9EFF') : '#1E2A3A'}`,
                  backgroundColor: form.platform === p ? (p === 'zppa' ? '#00C89620' : '#3B9EFF20') : 'transparent',
                  color: form.platform === p ? (p === 'zppa' ? '#00C896' : '#3B9EFF') : '#64748B',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}
              >
                {p === 'zppa' ? 'ZPPA (Zambia)' : 'UNGM (United Nations)'}
              </button>
            ))}
          </div>

          {/* Ref and deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
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
              <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Closing Deadline *
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

          {/* Title */}
          <div>
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
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

          {/* Entity */}
          <div>
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Procuring Entity *
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

          {/* Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px' }}>
            <div>
              <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Currency
              </label>
              <select
                value={form.currency}
                onChange={e => handleChange('currency', e.target.value)}
                style={{
                  width: '100%', backgroundColor: '#111827',
                  border: '1px solid #1E2A3A', borderRadius: '6px',
                  padding: '10px 14px', color: '#E2E8F0', fontSize: '13px', outline: 'none'
                }}
              >
                <option value="ZMW">ZMW (K)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
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
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Tender Requirements (from tender document)
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
            <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Tender Description (paste from tender — more detail = better bid)
            </label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Paste the tender scope of work or description here..."
              rows={4}
              style={{
                width: '100%', backgroundColor: '#111827',
                border: '1px solid #1E2A3A', borderRadius: '6px',
                padding: '10px 14px', color: '#E2E8F0', fontSize: '13px',
                outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FF000015', border: '1px solid #FF000040',
              borderRadius: '6px', padding: '10px 14px', color: '#FF6B6B', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={() => {
              const err = validateStep1()
              if (err) { setError(err); return }
              setError('')
              setStep(2)
            }}
            style={{
              backgroundColor: '#00C896', color: '#0B0F1A',
              border: 'none', padding: '12px 32px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: 'bold'
            }}
          >
            Next — Upload Documents
          </button>
        </div>
      )}

      {/* STEP 2 — Upload Documents */}
      {step === 2 && (
        <div>
          <div style={{
            backgroundColor: '#111827', border: '1px solid #1E2A3A',
            borderRadius: '10px', padding: '14px 20px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: 'bold' }}>
                Documents Uploaded
              </div>
              <div style={{ color: '#64748B', fontSize: '12px' }}>
                {getRequiredUploaded()}/{getRequiredCount()} required | {getUploadedCount()} total
              </div>
            </div>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: `conic-gradient(#00C896 ${(getRequiredUploaded() / getRequiredCount()) * 360}deg, #1E2A3A 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '50%',
                backgroundColor: '#111827',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00C896', fontSize: '13px', fontWeight: 'bold'
              }}>
                {Math.round((getRequiredUploaded() / getRequiredCount()) * 100)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {CERTIFICATE_TYPES.map(cert => (
              <div key={cert.id} style={{
                backgroundColor: '#111827',
                border: `1px solid ${uploadedDocs[cert.id] ? '#00C89640' : '#1E2A3A'}`,
                borderRadius: '8px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                {/* Status icon */}
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: uploadedDocs[cert.id] ? '#00C896' : '#1E2A3A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: uploadedDocs[cert.id] ? '#0B0F1A' : '#475569',
                  fontSize: '12px', fontWeight: 'bold'
                }}>
                  {uploadedDocs[cert.id] ? '✓' : '?'}
                </div>

                {/* Label */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#E2E8F0', fontSize: '13px' }}>
                    {cert.label}
                    {cert.required && (
                      <span style={{ color: '#FF6B6B', fontSize: '10px', marginLeft: '6px' }}>
                        REQUIRED
                      </span>
                    )}
                  </div>
                  {uploadedDocs[cert.id] && (
                    <div style={{ color: '#00C896', fontSize: '11px' }}>
                      {uploadedDocs[cert.id]}
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <label style={{
                  backgroundColor: uploadedDocs[cert.id] ? 'transparent' : '#1E2A3A',
                  border: `1px solid ${uploadedDocs[cert.id] ? '#00C896' : '#334155'}`,
                  color: uploadedDocs[cert.id] ? '#00C896' : '#94A3B8',
                  padding: '5px 12px', borderRadius: '5px',
                  cursor: 'pointer', fontSize: '12px', flexShrink: 0
                }}>
                  {uploadedDocs[cert.id] ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={e => handleFileUpload(cert.id, e.target.files[0])}
                  />
                </label>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                backgroundColor: 'transparent', color: '#64748B',
                border: '1px solid #1E2A3A', padding: '12px 24px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
              }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              style={{
                backgroundColor: '#00C896', color: '#0B0F1A',
                border: 'none', padding: '12px 32px',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 'bold', flex: 1
              }}
            >
              Next — Generate Bid
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Generate */}
      {step === 3 && (
        <div>
          {/* Summary */}
          <div style={{
            backgroundColor: '#111827', border: '1px solid #1E2A3A',
            borderRadius: '10px', padding: '20px', marginBottom: '20px'
          }}>
            <div style={{ color: '#94A3B8', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Bid Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Platform', value: form.platform.toUpperCase() },
                { label: 'Reference', value: form.ref },
                { label: 'Title', value: form.title },
                { label: 'Entity', value: form.entity },
                { label: 'Deadline', value: form.deadline },
                { label: 'Value', value: `${form.currency} ${form.value || 'As per BOQ'}` },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ color: '#475569', fontSize: '11px' }}>{item.label}</div>
                  <div style={{ color: '#E2E8F0', fontSize: '13px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents summary */}
          <div style={{
            backgroundColor: '#111827', border: '1px solid #1E2A3A',
            borderRadius: '10px', padding: '20px', marginBottom: '20px'
          }}>
            <div style={{ color: '#94A3B8', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Documents ({getUploadedCount()} uploaded)
            </div>
            {CERTIFICATE_TYPES.map(cert => (
              <div key={cert.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '4px 0', borderBottom: '1px solid #1E2A3A'
              }}>
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>{cert.label}</span>
                <span style={{
                  fontSize: '11px',
                  color: uploadedDocs[cert.id] ? '#00C896' : cert.required ? '#FF6B6B' : '#475569'
                }}>
                  {uploadedDocs[cert.id] ? 'ATTACHED' : cert.required ? 'MISSING' : 'NOT PROVIDED'}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FF000015', border: '1px solid #FF000040',
              borderRadius: '6px', padding: '10px 14px', color: '#FF6B6B',
              fontSize: '13px', marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                backgroundColor: 'transparent', color: '#64748B',
                border: '1px solid #1E2A3A', padding: '12px 24px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
              }}
            >
              Back
            </button>
            <button
              onClick={generateBid}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#1E2A3A' : '#00C896',
                color: loading ? '#64748B' : '#0B0F1A',
                border: 'none', padding: '12px 32px',
                borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 'bold', flex: 1
              }}
            >
              {loading ? 'AI is generating your bid...' : 'Generate Complete Bid Document'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManualTenderForm