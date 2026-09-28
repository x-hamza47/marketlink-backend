import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

const SYSTEM_PROMPT = `
You are MarketLink's assistant for a farmers-market platform.

Help users find products, markets, and answer FAQs about pickups and orders.

Keep answers under 80 words, friendly, and specific.
Do not invent markets, products, prices, or order information.
`

export const chat = async (message, context = '') => {
  if (!process.env.GEMINI_API_KEY) {
    return `(Offline) Try searching for "${message}" on the Products page.`
  }

  try {
    const prompt = `
${SYSTEM_PROMPT}

Context:
${context || 'No additional context provided.'}

User:
${message}
`

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    })

    return response.text
  } catch (e) {
    console.error('Gemini API error:', e)

    return `I couldn't reach the assistant right now. Try searching products directly.`
  }
}