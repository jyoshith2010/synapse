const SYNAPSE_IDENTITY = `You are Synapse AI — the built-in academic intelligence of the Synapse study platform.

You are NOT a generic chatbot. You are tuned exclusively for Indian PUC students (Science & Commerce), CBSE/ISC boards, and exams like JEE, NEET, CUET, and board exams.

Core Principles:
- Explain step-by-step for maths/science with clear reasoning
- Use simple, clear English appropriate for Indian students
- For commerce subjects, use accurate terminology and accounting standards
- Be encouraging but honest about difficulty levels
- Format responses with clear headings, bullet points, and numbered lists
- Include memory tricks, mnemonics, and exam strategies when relevant
- Never tell students to get API keys or leave Synapse
- Reference NCERT/CBSE patterns when applicable
- Provide exam-focused answers that match board patterns
`

/**
 * Using Groq API (free, fast Llama models) - more reliable for launch
 */
async function callGroqAPI(prompt, systemInstruction = SYNAPSE_IDENTITY) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  console.log('Groq API Key found:', !!apiKey, 'Length:', apiKey?.length || 0)
  if (!apiKey) {
    throw new Error('API key not configured')
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Groq API Error:', response.status, errorText)
    throw new Error(`API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('Response received')
  return data.choices?.[0]?.message?.content || 'No response from AI'
}

/**
 * Chat with conversation history using Groq
 */
export async function synapseChat(messages, user) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('API key not configured')
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions'
  
  // Build conversation history
  const messageHistory = messages
    .filter((m) => m?.content?.trim())
    .slice(-10)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content.trim(),
    }))

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYNAPSE_IDENTITY },
        ...messageHistory
      ],
      temperature: 0.7,
      max_tokens: 2048,
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Chat API Error:', response.status, errorText)
    throw new Error(`API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response from AI'
}

/**
 * Summarize text
 */
export async function synapseSummarize(text, subject, user) {
  const prompt = `${SYNAPSE_IDENTITY}

Task:
Summarize the student's study material into exam-ready notes optimized for Indian PUC exams.

Structure your response:
## Key Concepts
- Bullet points of main ideas
- Include NCERT/CBSE terminology where applicable

## Important Definitions
- Clear, concise definitions
- Use standard textbook language

## Formulas & Theorems
- All relevant formulas with variable explanations
- Theorem statements with conditions

## Exam Takeaways (3-5 points)
- Most important points for exams
- Common question patterns
- Tips for scoring full marks

## Likely Exam Questions (2-3)
- Questions that frequently appear in JEE/NEET/CUET/Board exams
- Include both conceptual and numerical questions

Content to summarize:
${text}`

  return callGroqAPI(prompt)
}

/**
 * Create flashcards
 */
export async function synapseFlashcards(text, subject, user) {
  const prompt = `${SYNAPSE_IDENTITY}

Task:
Create 8-10 high-quality flashcards from the content that would help a PUC student revise effectively.

Each flashcard should test:
- Key definitions
- Important formulas
- Conceptual understanding
- Common exam questions

Return ONLY valid JSON:
[
  {
    "question": "...",
    "answer": "..."
  }
]

Make questions challenging but fair - similar to exam difficulty level.

Content:
${text}`

  return callGroqAPI(prompt)
}

/**
 * Clean OCR text
 */
export async function synapseCleanOcr(text, user) {
  const prompt = `${SYNAPSE_IDENTITY}

Task:
Clean and format OCR text from scanned textbook pages or handwritten notes.

Instructions:
- Fix spacing and line breaks
- Correct common OCR errors (e.g., '0' vs 'O', '1' vs 'I')
- Preserve all factual content and numbers
- Fix mathematical notation (e.g., convert "x2" to "x²")
- Maintain paragraph structure
- Remove page headers/footers if present
- Keep chemical formulas and equations intact

Return only the cleaned, properly formatted text.

OCR text:
${text}`

  return callGroqAPI(prompt)
}

/**
 * Format errors for display
 */
export function formatSynapseError(err) {
  const msg = err?.message || 'Something went wrong.'
  
  if (msg.includes('API key')) {
    return 'API key not configured. Please check your environment variables.'
  }
  if (msg.includes('resource_exhausted') || msg.includes('overloaded')) {
    return 'AI service is busy. Please try again in a moment.'
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return 'AI model not available. Please try again later.'
  }
  
  return msg
}
