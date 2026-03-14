// ChatBot.jsx — AI Procurement Consultant
// This component connects to the real Claude AI API
import { useState } from 'react'

// This is your company profile — Claude will know this automatically
const COMPANY_PROFILE = `
You are an AI procurement consultant for Cyrene Technologies Limited, 
a Zambian ICT company based in Lusaka. You help them win government tenders.

Company Details:
- Name: Cyrene Technologies Limited
- Location: Lusaka, Zambia
- Speciality: ICT equipment supply, networking, computers, servers
- Platforms: ZPPA e-GP (eprocure.zppa.org.zm) and UNGM (ungm.org)

Your job:
- Answer any question about ZPPA or UNGM procurement
- Help prepare bid documents
- Explain compliance requirements
- Give advice on tender strategy
- Always be practical and specific to Zambia

Keep answers clear and simple. Use bullet points where helpful.
`

function ChatBot() {

  // Store all messages in the conversation
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Muli bwanji! 👋 I am your AI procurement consultant for Cyrene Technologies.

I can help you with:
- Finding and understanding ZPPA tenders
- UNGM United Nations tender opportunities  
- Preparing bid documents
- Compliance requirements (TCC, PACRA, TPIN)
- Bid strategy and pricing

What would you like help with today?`
    }
  ])

  // Current message being typed
  const [input, setInput] = useState('')

  // Loading state while AI is thinking
  const [loading, setLoading] = useState(false)

  // This function sends message to Claude AI
  async function sendMessage() {

    // Don't send empty messages
    if (!input.trim()) return

    // Add user message to chat
    const userMessage = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {

      // Call the Claude API
      // import.meta.env reads from your .env file
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
          max_tokens: 1024,
          system: COMPANY_PROFILE,
          messages: updatedMessages
        })
      })

      // Read the response
      const data = await response.json()

      // Extract the text from Claude's response
      const aiReply = data.content[0].text

      // Add Claude's reply to the chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiReply
      }])

    } catch (error) {
      // If something goes wrong show an error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Connection error. Please check your internet and try again.'
      }])
    }

    setLoading(false)
  }

  // Send message when Enter key is pressed
  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage()
    }
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 20px 40px'
    }}>

      {/* Chat heading */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ color: '#F1F5F9', fontSize: '18px', marginBottom: '4px' }}>
          🧠 AI Procurement Consultant
        </h3>
        <p style={{ color: '#64748B', fontSize: '13px' }}>
          Powered by Claude AI — Knows ZPPA, UNGM and Zambian procurement law
        </p>
      </div>

      {/* Messages area */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1E2A3A',
        borderRadius: '12px',
        padding: '20px',
        height: '400px',
        overflowY: 'auto',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map(function(msg, index) {
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                backgroundColor: msg.role === 'user' ? '#00C89620' : '#1E2A3A',
                border: `1px solid ${msg.role === 'user' ? '#00C89640' : '#2D3748'}`,
                borderRadius: msg.role === 'user'
                  ? '12px 12px 0 12px'
                  : '12px 12px 12px 0',
                padding: '12px 16px',
                color: '#E2E8F0',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {/* Show who sent the message */}
                <div style={{
                  fontSize: '11px',
                  color: msg.role === 'user' ? '#00C896' : '#64748B',
                  marginBottom: '6px',
                  fontWeight: 'bold'
                }}>
                  {msg.role === 'user' ? '👤 You' : '🧠 AI Consultant'}
                </div>
                {msg.content}
              </div>
            </div>
          )
        })}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              backgroundColor: '#1E2A3A',
              border: '1px solid #2D3748',
              borderRadius: '12px 12px 12px 0',
              padding: '12px 16px',
              color: '#64748B',
              fontSize: '14px'
            }}>
              🧠 AI Consultant is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Quick question buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '12px'
      }}>
        {[
          'What documents do I need to bid on ZPPA?',
          'How do I register on UNGM?',
          'What is a Tax Compliance Certificate?',
          'How do I calculate my bid price?'
        ].map(function(question) {
          return (
            <button
              key={question}
              onClick={() => setInput(question)}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #1E2A3A',
                color: '#64748B',
                padding: '6px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {question}
            </button>
          )
        })}
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything about ZPPA or UNGM procurement..."
          style={{
            flex: 1,
            backgroundColor: '#111827',
            border: '1px solid #1E2A3A',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#E2E8F0',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: loading || !input.trim() ? '#1E2A3A' : '#00C896',
            color: loading || !input.trim() ? '#64748B' : '#0B0F1A',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '...' : 'Send →'}
        </button>
      </div>

    </div>
  )
}

export default ChatBot
