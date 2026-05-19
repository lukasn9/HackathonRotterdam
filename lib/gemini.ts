import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Attendee, TranscriptLine } from './store'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function buildSystemPrompt(transcript: TranscriptLine[], currentIndex: number, attendee: Attendee): string {
  const transcriptSoFar = transcript
    .slice(0, currentIndex + 1)
    .map((l) => l.text)
    .join('\n')

  const styleInstruction =
    attendee.proficiencyLevel === 'Novice'
      ? 'Explain using plain language and everyday analogies. Avoid jargon; if a term from the transcript must be used, define it immediately.'
      : attendee.proficiencyLevel === 'Intermediate'
      ? 'Use standard terminology. Briefly explain any specialised concept that appears in the transcript.'
      : 'Be technically precise when explaining what the speaker said. You may use domain terminology appropriate for an expert.'

  return `You are a Q&A assistant for a live presentation. Your knowledge is strictly limited to the speaker transcript provided below. You have no other information about this topic.

TRANSCRIPT — the only source you may draw from:
---
${transcriptSoFar || '(The presentation has not started yet — no content to reference.)'}
---

STRICT RULES:
1. Answer using ONLY what appears word-for-word or by clear implication in the transcript above.
2. If the answer is not in the transcript, reply with exactly: "That hasn't been covered yet in the presentation."
3. Do not add facts, examples, or context from your training knowledge, even if you are confident they are correct.
4. Do not speculate about what the speaker might say next.

COMMUNICATION STYLE (apply only to content that IS in the transcript):
${styleInstruction}

Keep answers short: 2–3 sentences for simple questions, 4 sentences maximum for complex ones.`
}

export async function summarizeTranscript({
  transcript,
  currentIndex,
  attendee,
}: {
  transcript: TranscriptLine[]
  currentIndex: number
  attendee: Attendee
}): Promise<string> {
  if (currentIndex < 0) return 'The presentation has not started yet.'

  const transcriptSoFar = transcript
    .slice(0, currentIndex + 1)
    .map((l) => l.text)
    .join('\n')

  const styleInstruction =
    attendee.proficiencyLevel === 'Novice'
      ? 'Plain language only. No jargon.'
      : attendee.proficiencyLevel === 'Intermediate'
      ? 'Standard terminology, brief explanations.'
      : 'Technically precise, no simplification needed.'

  const systemPrompt = `You are summarizing a live presentation for a late-joining attendee. Summarize ONLY what is in the transcript below — do not add outside knowledge.

TRANSCRIPT:
---
${transcriptSoFar}
---

STYLE: ${styleInstruction}

Write 2–3 bullet points maximum. Each bullet is one short sentence. Start each bullet with a bold keyword. No headers, no preamble — just the bullets.`

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: 'Summarize the presentation so far.' }] }],
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 200, temperature: 0.2 },
  })
  return result.response.text()
}

export async function answerQuestion({
  question,
  transcript,
  currentIndex,
  attendee,
}: {
  question: string
  transcript: TranscriptLine[]
  currentIndex: number
  attendee: Attendee
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: question }] }],
    systemInstruction: buildSystemPrompt(transcript, currentIndex, attendee),
    generationConfig: { maxOutputTokens: 300, temperature: 0.2 },
  })
  return result.response.text()
}
