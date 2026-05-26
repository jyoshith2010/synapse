const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { defineSecret } = require('firebase-functions/params')

// Use secret if available (Blaze plan), otherwise fallback to env var (for testing)
const geminiKeySecret = defineSecret('GEMINI_API_KEY')

initializeApp()

async function getGeminiKey() {
  try {
    // Try to get from secret (Blaze plan)
    return geminiKeySecret.value()
  } catch (e) {
    // Fallback to environment variable for testing on free tier
    return process.env.GEMINI_API_KEY || 'AIzaSyBXpLPr3mH8Cis1veNlsr5ihY0tIANfcME'
  }
}

let genAI = null

// Initialize genAI when needed
async function getGenAI() {
  if (!genAI) {
    const apiKey = await getGeminiKey()
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

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

const TASK_PROMPTS = {
  chat: SYNAPSE_IDENTITY,

  summarize: `${SYNAPSE_IDENTITY}

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
- Include both conceptual and numerical questions`,

  flashcards: `${SYNAPSE_IDENTITY}

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

Make questions challenging but fair - similar to exam difficulty level.`,

  explain: `${SYNAPSE_IDENTITY}

Task:
Explain the student's doubt step-by-step with complete reasoning.

Structure:
1. **Understanding the Problem** - Restate what's being asked
2. **Step-by-Step Solution** - Each step clearly explained
3. **Key Concepts Used** - Reference relevant theorems/formulas
4. **Common Mistakes** - What students typically get wrong
5. **Memory Trick** - A mnemonic or trick to remember this
6. **Exam Tip** - How this might appear in exams

For numerical problems: Show all calculations with units.
For theory: Connect to real-world applications if relevant.`,

  scan_cleanup: `${SYNAPSE_IDENTITY}

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

Return only the cleaned, properly formatted text.`,

  study_plan: `${SYNAPSE_IDENTITY}

Task:
Create a personalized study plan based on the student's current topics and exam goals.

Consider:
- Time available until exam
- Student's current level (weak/strong areas)
- Subject weightage in exam
- Optimal study sequence (prerequisites first)
- Break times to prevent burnout

Provide:
1. Daily schedule with time blocks
2. Weekly milestones
3. Revision strategy
4. Practice test schedule
5. Break recommendations`,

  doubt_solver: `${SYNAPSE_IDENTITY}

Task:
Solve the student's specific doubt with exam-focused explanation.

Provide:
1. Direct answer to the question
2. Step-by-step reasoning
3. Related concepts they should know
4. How this connects to broader syllabus
5. Practice questions on this topic
6. Where this appears in exams (chapter, weightage)`
}

function studentContext(data) {
  const parts = []

  if (data?.stream) {
    parts.push(`Stream: ${data.stream}`)
  }

  if (data?.examGoal) {
    parts.push(`Exam Goal: ${data.examGoal}`)
  }

  if (data?.subject) {
    parts.push(`Subject: ${data.subject}`)
  }

  return parts.length
    ? `\nStudent Profile: ${parts.join(' | ')}`
    : ''
}

function toGeminiHistory(messages = []) {
  return messages
    .filter((m) => m?.content?.trim())
    .slice(-12)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content.trim() }],
    }))
}

exports.synapseAi = onCall(
  {
    cors: true,
    maxInstances: 20,
    secrets: [geminiKeySecret],
  },

  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError(
          'unauthenticated',
          'Please log in to use Synapse AI.'
        )
      }

      const data = request.data || {}

      const task = data.task || 'chat'

      const system =
        (TASK_PROMPTS[task] || TASK_PROMPTS.chat) +
        studentContext(data)

      const ai = await getGenAI()
      const model = ai.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: system,
      })

      if (task === 'chat') {
        const messages = data.messages || []

        const prompt =
          data.message ||
          messages[messages.length - 1]?.content

        if (!prompt?.trim()) {
          throw new HttpsError(
            'invalid-argument',
            'Message is required.'
          )
        }

        const history = toGeminiHistory(
          messages.slice(0, -1)
        )

        const chat = model.startChat({
          history,
        })

        const result = await chat.sendMessage(
          prompt.trim()
        )

        return {
          text: result.response.text(),
          provider: 'synapse-ai',
        }
      }

      const prompt = data.message || data.text

      if (!prompt?.trim()) {
        throw new HttpsError(
          'invalid-argument',
          'Content is required.'
        )
      }

      const result = await model.generateContent(
        prompt.trim()
      )

      return {
        text: result.response.text(),
        provider: 'synapse-ai',
      }

    } catch (err) {
      console.error('Synapse AI Error:', err)

      if (err instanceof HttpsError) {
        throw err
      }

      throw new HttpsError(
        'internal',
        err.message || 'Synapse AI failed.'
      )
    }
  }
)