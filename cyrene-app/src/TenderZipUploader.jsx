// TenderZipUploader.jsx
// Reads a ZPPA tender ZIP file and extracts all documents
// Then sends the content to AI for analysis

import { useState } from 'react'
import JSZip from 'jszip'

function TenderZipUploader({ onTenderExtracted }) {
  const [loading, setLoading] = useState(false)
  const [extractedFiles, setExtractedFiles] = useState([])
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  async function handleZipUpload(file) {
    if (!file) return
    setLoading(true)
    setError('')
    setExtractedFiles([])

    try {
      // Read the ZIP file
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)

      console.log('ZIP contents:', Object.keys(contents.files))

      const files = []

      // Extract each file from the ZIP
      for (const [filename, fileData] of Object.entries(contents.files)) {
        if (!fileData.dir) {
          try {
            // Try to read as text first
            let content = ''
            const extension = filename.split('.').pop().toLowerCase()

            if (['txt', 'xml', 'html', 'htm', 'csv'].includes(extension)) {
              content = await fileData.async('text')
            } else if (['pdf', 'doc', 'docx'].includes(extension)) {
              // For binary files, just note they exist
              content = `[${extension.toUpperCase()} file — ${filename}]`
            } else {
              content = `[${extension.toUpperCase()} file — ${filename}]`
            }

            files.push({
              name: filename,
              extension: extension,
              content: content,
              size: content.length
            })
          } catch (e) {
            files.push({
              name: filename,
              extension: filename.split('.').pop().toLowerCase(),
              content: `[Could not read file content]`,
              size: 0
            })
          }
        }
      }

      setExtractedFiles(files)
      console.log(`Extracted ${files.length} files from ZIP`)

    } catch (err) {
      setError('Could not read ZIP file. Make sure it is a valid ZIP file from ZPPA.')
      console.error(err)
    }

    setLoading(false)
  }

  async function analyzeTender() {
    if (extractedFiles.length === 0) return
    setAnalyzing(true)
    setError('')

    try {
      // Build a summary of all files for AI
      const filesSummary = extractedFiles
        .map(f => `FILE: ${f.name}\nCONTENT:\n${f.content.substring(0, 500)}`)
        .join('\n\n---\n\n')

      // Send to Claude AI for analysis
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
          system: `You are a procurement expert analyzing ZPPA tender documents for 
Cyrene Technologies Limited, a Zambian ICT company. Extract key tender information.`,
          messages: [{
            role: 'user',
            content: `Analyze these files from a ZPPA tender ZIP download and extract:

1. Tender Reference Number
2. Tender Title
3. Procuring Entity (Ministry/Organization)
4. Closing Deadline
5. Estimated Value (if mentioned)
6. Required Documents/Certificates
7. Scope of Work / Description
8. Special Requirements

Files from ZIP:
${filesSummary}

Return the information in this exact format:
REF: [reference number]
TITLE: [tender title]
ENTITY: [procuring entity]
DEADLINE: [closing date]
VALUE: [value or "Not specified"]
REQUIREMENTS: [comma separated list]
DESCRIPTION: [scope of work summary]
SPECIAL: [any special requirements]`
          }]
        })
      })

      const data = await response.json()
      const analysis = data.content[0].text

      // Parse AI response into form fields
      const parsed = {}
      const lines = analysis.split('\n')

      lines.forEach(line => {
        if (line.startsWith('REF:')) parsed.ref = line.replace('REF:', '').trim()
        if (line.startsWith('TITLE:')) parsed.title = line.replace('TITLE:', '').trim()
        if (line.startsWith('ENTITY:')) parsed.entity = line.replace('ENTITY:', '').trim()
        if (line.startsWith('DEADLINE:')) parsed.deadline = line.replace('DEADLINE:', '').trim()
        if (line.startsWith('VALUE:')) parsed.value = line.replace('VALUE:', '').trim()
        if (line.startsWith('REQUIREMENTS:')) parsed.requirements = line.replace('REQUIREMENTS:', '').trim()
        if (line.startsWith('DESCRIPTION:')) parsed.description = line.replace('DESCRIPTION:', '').trim()
      })

      // Send extracted data back to parent form
      onTenderExtracted(parsed, extractedFiles)

    } catch (err) {
      setError('Error analyzing tender. Check your internet connection.')
      console.error(err)
    }

    setAnalyzing(false)
  }

  return (
    <div style={{
      backgroundColor: '#111827',
      border: '2px dashed #1E2A3A',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
        <h3 style={{ color: '#F1F5F9', fontSize: '15px', marginBottom: '6px' }}>
          Upload Tender ZIP File
        </h3>
        <p style={{ color: '#64748B', fontSize: '12px', lineHeight: '1.6' }}>
          Download the tender ZIP from ZPPA e-GP portal and upload it here.
          The AI will read all documents inside and fill in the form automatically.
        </p>
      </div>

      {/* Upload button */}
      <label style={{
        display: 'block', textAlign: 'center',
        backgroundColor: '#1E2A3A', border: '1px solid #334155',
        borderRadius: '8px', padding: '12px',
        cursor: 'pointer', color: '#94A3B8', fontSize: '13px',
        marginBottom: '16px'
      }}>
        {loading ? 'Reading ZIP file...' : 'Click to upload tender ZIP file'}
        <input
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          onChange={e => handleZipUpload(e.target.files[0])}
          disabled={loading}
        />
      </label>

      {/* Extracted files list */}
      {extractedFiles.length > 0 && (
        <div>
          <div style={{
            backgroundColor: '#0B0F1A', border: '1px solid #1E2A3A',
            borderRadius: '8px', padding: '12px', marginBottom: '12px'
          }}>
            <div style={{ color: '#00C896', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>
              Found {extractedFiles.length} files in ZIP:
            </div>
            {extractedFiles.map((file, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 0', borderBottom: '1px solid #1E2A3A'
              }}>
                <span style={{ fontSize: '14px' }}>
                  {file.extension === 'pdf' ? '📄' :
                   file.extension === 'doc' || file.extension === 'docx' ? '📝' :
                   file.extension === 'xls' || file.extension === 'xlsx' ? '📊' : '📋'}
                </span>
                <span style={{ color: '#E2E8F0', fontSize: '12px', flex: 1 }}>{file.name}</span>
                <span style={{ color: '#475569', fontSize: '11px' }}>
                  {file.extension.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Analyze button */}
          <button
            onClick={analyzeTender}
            disabled={analyzing}
            style={{
              width: '100%',
              backgroundColor: analyzing ? '#1E2A3A' : '#00C896',
              color: analyzing ? '#64748B' : '#0B0F1A',
              border: 'none', padding: '12px',
              borderRadius: '8px', cursor: analyzing ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 'bold'
            }}
          >
            {analyzing ? 'AI is reading tender documents...' : 'Analyze Tender with AI'}
          </button>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#FF000015', border: '1px solid #FF000040',
          borderRadius: '6px', padding: '10px', color: '#FF6B6B',
          fontSize: '12px', marginTop: '12px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        marginTop: '12px', padding: '10px',
        backgroundColor: '#0B0F1A', borderRadius: '6px'
      }}>
        <div style={{ color: '#475569', fontSize: '11px', lineHeight: '1.6' }}>
          How to get the ZIP file from ZPPA:
          1. Log in to eprocure.zppa.org.zm
          2. Find your tender
          3. Click "Download Tender Documents"
          4. Upload the downloaded ZIP file here
        </div>
      </div>
    </div>
  )
}

export default TenderZipUploader