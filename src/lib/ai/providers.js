export const DEFAULT_AI_PROVIDER = 'geminiflash'

export const AI_PROVIDERS = [
  {
    id: 'geminiflash',
    name: 'Gemini 1.5 Flash',
    by: 'Google',
    desc: 'Synapse default — fast, free tier on Google AI Studio',
    color: '#4285f4',
    base: 'https://generativelanguage.googleapis.com/v1beta',
    default: true,
  },
  {
    id: 'gemini15pro',
    name: 'Gemini 1.5 Pro',
    by: 'Google',
    desc: 'Stronger reasoning, larger context',
    color: '#4285f4',
    base: 'https://generativelanguage.googleapis.com/v1beta',
  },
  { id: 'gpt4o', name: 'GPT-4o', by: 'OpenAI', desc: 'Bring your OpenAI API key', color: '#10a37f', base: 'https://api.openai.com/v1' },
  { id: 'gpt4mini', name: 'GPT-4o Mini', by: 'OpenAI', desc: 'Fast & affordable', color: '#10a37f', base: 'https://api.openai.com/v1' },
  { id: 'claude35', name: 'Claude 3.5 Sonnet', by: 'Anthropic', desc: 'Bring your Anthropic API key', color: '#d97706', base: 'https://api.anthropic.com/v1' },
  { id: 'claude3haiku', name: 'Claude 3 Haiku', by: 'Anthropic', desc: 'Quick answers', color: '#d97706', base: 'https://api.anthropic.com/v1' },
  { id: 'grok2', name: 'Grok 2', by: 'xAI', desc: 'Bring your xAI API key', color: '#1da1f2', base: 'https://api.x.ai/v1' },
  { id: 'mistral', name: 'Mistral Large', by: 'Mistral AI', desc: 'Bring your Mistral API key', color: '#ff7000', base: 'https://api.mistral.ai/v1' },
  { id: 'deepseek', name: 'DeepSeek V3', by: 'DeepSeek', desc: 'Great for Maths & Science', color: '#4f46e5', base: 'https://api.deepseek.com/v1' },
  { id: 'llama', name: 'Llama 3.1', by: 'Meta (via Groq)', desc: 'Free tier on Groq', color: '#0668e1', base: 'https://api.groq.com/openai/v1' },
  { id: 'custom', name: 'Custom Model', by: 'Any provider', desc: 'OpenAI-compatible endpoint + your key', color: '#00ffe0', base: '' },
]

const MODEL_IDS = {
  gpt4o: 'gpt-4o',
  gpt4mini: 'gpt-4o-mini',
  claude35: 'claude-3-5-sonnet-20241022',
  claude3haiku: 'claude-3-haiku-20240307',
  gemini15pro: 'gemini-1.5-pro',
  geminiflash: 'gemini-1.5-flash',
  grok2: 'grok-2-latest',
  mistral: 'mistral-large-latest',
  deepseek: 'deepseek-chat',
  llama: 'llama-3.1-70b-versatile',
}

export function getProvider(id) {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0]
}

export function getModelId(providerId, customName) {
  if (providerId === 'custom' && customName) return customName
  return MODEL_IDS[providerId] || 'gemini-1.5-flash'
}

export function isGeminiProvider(providerId) {
  return providerId === 'geminiflash' || providerId === 'gemini15pro'
}

export function isAnthropicProvider(providerId) {
  return providerId === 'claude35' || providerId === 'claude3haiku'
}
