// server.js — Cyrene Technologies Bidding Agent Backend
// This server handles: tender scraping, bid generation, and data storage

const http = require('http')
const fs = require('fs')

// ===== CYRENE COMPANY PROFILE =====
const COMPANY = {
  name: 'Cyrene Technologies Limited',
  location: 'Lusaka, Zambia',
  tpin: '1003456789',
  pacra: '120240012345',
  email: 'info@cyrenetechnologies.co.zm',
  phone: '+260 977 123 456',
  director: 'Andrew Mwape',
  speciality: 'ICT Equipment Supply, Networking, Computers, Servers'
}

// ===== MOCK ZPPA TENDERS DATABASE =====
// Later this will be replaced with real scraped data
const ZPPA_TENDERS = [
  {
    id: 'ZPPA/OPEN/ICT/2026/001',
    title: 'Supply of ICT Equipment',
    ministry: 'Ministry of Technology and Science',
    deadline: '2026-03-30',
    value: 1200000,
    currency: 'ZMW',
    category: 'ICT',
    status: 'OPEN',
    requirements: ['PACRA', 'TCC', 'TPIN', 'Audited Accounts', 'Bank Guarantee']
  },
  {
    id: 'ZPPA/OPEN/ICT/2026/002',
    title: 'Supply of Printers and Copiers',
    ministry: 'Ministry of Education',
    deadline: '2026-04-05',
    value: 450000,
    currency: 'ZMW',
    category: 'ICT',
    status: 'OPEN',
    requirements: ['PACRA', 'TCC', 'TPIN', 'Manufacturer Authorization']
  },
  {
    id: 'ZPPA/OPEN/ICT/2026/003',
    title: 'Network Infrastructure Setup',
    ministry: 'Zambia Revenue Authority',
    deadline: '2026-04-12',
    value: 2800000,
    currency: 'ZMW',
    category: 'ICT',
    status: 'OPEN',
    requirements: ['PACRA', 'TCC', 'TPIN', 'Technical Proposal', 'Bank Guarantee']
  },
  {
    id: 'ZPPA/OPEN/ICT/2026/004',
    title: 'Supply of Server Infrastructure',
    ministry: 'Bank of Zambia',
    deadline: '2026-04-18',
    value: 4500000,
    currency: 'ZMW',
    category: 'ICT',
    status: 'OPEN',
    requirements: ['PACRA', 'TCC', 'TPIN', 'Audited Accounts', 'Bank Guarantee', 'ISO Certification']
  }
]

// ===== MOCK UNGM TENDERS DATABASE =====
const UNGM_TENDERS = [
  {
    id: 'UNDP-ZMB-2026-001',
    title: 'Supply of Laptops and Accessories',
    ministry: 'UNDP Zambia',
    deadline: '2026-04-02',
    value: 85000,
    currency: 'USD',
    category: 'ICT',
    status: 'OPEN',
    requirements: ['UNGM Registration', 'PACRA', 'TCC', 'Financial Statements']
  },
  {
    id: 'UNICEF-ZMB-2026-014',
    title: 'ICT Network Equipment Supply',
    ministry: 'UNICEF Zambia',
    deadline: '2026-04-08',
    value: 120000,
    currency: 'USD',
    category: 'ICT',
    status: 'OPEN',
    requirements: ['UNGM Registration', 'PACRA', 'TCC', 'Manufacturer Authorization']
  },
  {
    id: 'WHO-ZMB-2026-007',
    title: 'Health IT Systems Supply',
    ministry: 'WHO Zambia',
    deadline: '2026-04-15',
    value: 200000,
    currency: 'USD',
    category: 'ICT',
    status: 'OPEN',
    requirements: ['UNGM Registration', 'PACRA', 'TCC', 'Technical Proposal', 'ISO Certification']
  }
]

// ===== BIDS DATABASE (saved to bids.json file) =====
const BIDS_FILE = 'bids.json'

// Load existing bids from file or start with empty array
function loadBids() {
  if (fs.existsSync(BIDS_FILE)) {
    return JSON.parse(fs.readFileSync(BIDS_FILE))
  }
  return []
}

// Save bids to file
function saveBids(bids) {
  fs.writeFileSync(BIDS_FILE, JSON.stringify(bids, null, 2))
}

// ===== BID DOCUMENT GENERATOR =====
function generateBidDocument(tender) {
  const today = new Date().toLocaleDateString('en-ZM')
  const bidValue = tender.currency === 'USD'
    ? `$${tender.value.toLocaleString()}`
    : `K ${tender.value.toLocaleString()}`

  return `
BID SUBMISSION DOCUMENT
=======================
Tender Reference: ${tender.id}
Tender Title: ${tender.title}
Procuring Entity: ${tender.ministry}
Submission Date: ${today}
Deadline: ${tender.deadline}

SUBMITTED BY:
Company: ${COMPANY.name}
Director: ${COMPANY.director}
Location: ${COMPANY.location}
TPIN: ${COMPANY.tpin}
PACRA: ${COMPANY.pacra}
Email: ${COMPANY.email}
Phone: ${COMPANY.phone}

BID PRICE: ${bidValue}

COMPLIANCE CHECKLIST:
${tender.requirements.map(r => `✓ ${r}`).join('\n')}

DECLARATION:
We, ${COMPANY.name}, hereby submit this bid in response 
to ${tender.id}. All information provided is true and accurate.

Signed: ${COMPANY.director}
Date: ${today}
  `.trim()
}

// ===== HTTP SERVER =====
const server = http.createServer((req, res) => {

  // Allow requests from your React app
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // ===== ROUTES =====

  // GET /tenders/zppa — get all ZPPA tenders
  if (req.url === '/tenders/zppa' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({
      success: true,
      platform: 'ZPPA',
      count: ZPPA_TENDERS.length,
      tenders: ZPPA_TENDERS
    }))
    return
  }

  // GET /tenders/ungm — get all UNGM tenders
  if (req.url === '/tenders/ungm' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({
      success: true,
      platform: 'UNGM',
      count: UNGM_TENDERS.length,
      tenders: UNGM_TENDERS
    }))
    return
  }

  // GET /bids — get all saved bids
  if (req.url === '/bids' && req.method === 'GET') {
    const bids = loadBids()
    res.writeHead(200)
    res.end(JSON.stringify({
      success: true,
      count: bids.length,
      bids: bids
    }))
    return
  }

  // POST /bids/prepare — generate and save a bid document
  if (req.url === '/bids/prepare' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const { tenderId, platform } = JSON.parse(body)

      // Find the tender
      const allTenders = [...ZPPA_TENDERS, ...UNGM_TENDERS]
      const tender = allTenders.find(t => t.id === tenderId)

      if (!tender) {
        res.writeHead(404)
        res.end(JSON.stringify({ success: false, error: 'Tender not found' }))
        return
      }

      // Generate bid document
      const document = generateBidDocument(tender)

      // Save bid to database
      const bids = loadBids()
      const newBid = {
        id: Date.now(),
        tenderId: tender.id,
        tenderTitle: tender.title,
        ministry: tender.ministry,
        platform: platform,
        value: tender.value,
        currency: tender.currency,
        deadline: tender.deadline,
        status: 'PREPARED',
        preparedAt: new Date().toISOString(),
        document: document
      }
      bids.push(newBid)
      saveBids(bids)

      res.writeHead(200)
      res.end(JSON.stringify({
        success: true,
        message: 'Bid document generated successfully',
        bid: newBid
      }))
    })
    return
  }

  // GET /company — get company profile
  if (req.url === '/company' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ success: true, company: COMPANY }))
    return
  }

  // 404 for unknown routes
  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Route not found' }))
})

// Start server on port 3001
server.listen(3001, () => {
  console.log('✅ Cyrene Bidding Agent Server running on http://localhost:3001')
  console.log('📡 Routes available:')
  console.log('   GET  /tenders/zppa')
  console.log('   GET  /tenders/ungm')
  console.log('   GET  /bids')
  console.log('   POST /bids/prepare')
  console.log('   GET  /company')
})
