import {
  getProvider,
  getModelId,
  isGeminiProvider,
  isAnthropicProvider,
} from './providers'

const SYSTEM_PROMPT =
  'You are Synapse, an expert tutor for Indian PUC students (Science & Commerce). ' +
  'Explain clearly, use simple English, include steps for maths/science, and stay exam-focused (JEE, NEET, CUET, boards). ' +
  'Keep answers concise unless the student asks for detail.'

function normalizeMessages(messages) {
  return messages
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content.trim(),
    }))
}

async function chatGemini(config, messages) {
  const model = getModelId(config.provider, config.customName)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(config.apiKey)}`

  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini error (${res.status})`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

async function chatAnthropic(config, messages) {
  const model = getModelId(config.provider, config.customName)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error?.message || `Anthropic error (${res.status})`)
  }

  const text = data?.content?.filter((b) => b.type === 'text').map((b) => b.text).join('') || ''
  if (!text) throw new Error('Claude returned an empty response.')
  return text
}

async function chatOpenAICompatible(config, messages) {
  const provider = getProvider(config.provider)
  const base = (config.provider === 'custom' ? config.customBase : provider.base)?.replace(/\/$/, '')
  if (!base) throw new Error('Add a custom API base URL for your model.')

  const model = getModelId(config.provider, config.customName)
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error?.message || `API error (${res.status})`)
  }

  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) throw new Error('Model returned an empty response.')
  return text
}

/** Send chat using the student's saved API key (BYOK). */
export async function sendChatMessage(config, messageHistory) {
  if (!config?.apiKey?.trim()) {
    throw new Error('Add your API key in AI Hub first. Gemini is free at aistudio.google.com.')
  }

  const messages = normalizeMessages(messageHistory)
  if (!messages.length) throw new Error('Message is empty.')

  if (isGeminiProvider(config.provider)) {
    return chatGemini(config, messages)
  }
  if (isAnthropicProvider(config.provider)) {
    return chatAnthropic(config, messages)
  }
  return chatOpenAICompatible(config, messages)
}

/** Quick connection test from AI Hub. */
export async function testAiConnection(config) {
  const reply = await sendChatMessage(config, [
    { role: 'user', content: 'Reply with exactly: Synapse connected' },
  ])
  if (!reply.toLowerCase().includes('synapse')) {
    return reply
  }
  return reply
}
