type AIMessage = {
  role: 'system' | 'user' | 'assistant'
  content: any
}

function getConfig() {
  const base = process.env.AI_BASE_URL?.replace(/\/$/, '')
  const key = process.env.AI_API_KEY

  if (!base || !key) {
    throw new Error('AI provider is not configured')
  }

  return {
    base,
    key,
    model: process.env.AI_MODEL || 'gpt-4.1-mini',
  }
}

/**
 * ارسال پیام به AI و دریافت پاسخ
 */
export async function aiChat(messages: AIMessage[]): Promise<string> {
  const config = getConfig()

  const response = await fetch(`${config.base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI provider error ${response.status}`)
  }

  const data = await response.json()
  return String(data.choices?.[0]?.message?.content || '')
}
