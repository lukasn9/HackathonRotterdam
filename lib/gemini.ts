import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Attendee, TranscriptLine } from './store'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function buildSystemPrompt(transcript: TranscriptLine[], currentIndex: number, attendee: Attendee): string {
  const transcriptSoFar = transcript
    .slice(0, currentIndex + 1)
    .map((l) => l.text)
    .join('\n')

  const proficiencyInstruction =
    attendee.proficiencyLevel === 'Novice'
      ? 'Explain concepts using everyday analogies. Avoid technical jargon. Use short sentences. If you must use a technical term, immediately define it in plain language.'
      : attendee.proficiencyLevel === 'Intermediate'
      ? 'Assume the attendee has foundational knowledge in their field. You may use standard terminology but briefly explain concepts from adjacent fields. Use concrete examples.'
      : 'Use precise technical terminology appropriate for a domain expert. Provide depth, nuance, and where relevant, cite limitations or open questions related to what the speaker described.'

  return `You are a knowledgeable assistant helping an audience member understand a live presentation.

ATTENDEE PROFILE:
- Name: ${attendee.name}
- Institution: ${attendee.institution}
- Field of Study: ${attendee.fieldOfStudy}
- Proficiency Level: ${attendee.proficiencyLevel}

COMMUNICATION STYLE:
${proficiencyInstruction}

FIELD CONTEXT:
The attendee studies ${attendee.fieldOfStudy}. When possible, connect the speaker's points to concepts or applications relevant to that field.

PRESENTATION TRANSCRIPT SO FAR:
${transcriptSoFar || '(The presentation has not started yet.)'}

Answer only based on what has been said in the presentation so far. If the question is about something not yet covered, say so briefly and offer context from what has been presented. Keep answers concise — 2 to 3 sentences for simple questions, up to 4 for complex ones.`
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

  const proficiencyInstruction =
    attendee.proficiencyLevel === 'Novice'
      ? 'Use plain language and everyday analogies. Avoid jargon. Keep each point short and concrete.'
      : attendee.proficiencyLevel === 'Intermediate'
      ? 'Use standard terminology. Include key concepts and briefly explain their significance.'
      : 'Be technically precise. Include domain-specific details and any nuances the speaker raised.'

  const systemPrompt = `You are summarizing a live presentation for an attendee who may have missed some content.

ATTENDEE PROFILE:
- Field of Study: ${attendee.fieldOfStudy}
- Proficiency Level: ${attendee.proficiencyLevel}

STYLE: ${proficiencyInstruction}

Write a concise catch-up summary of the presentation so far. Use 4-6 bullet points. Each bullet should capture one key idea. Start each bullet with a bold keyword or phrase. Do not use headers — just the bullet list.`

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Please summarize the following presentation transcript:\n\n${transcriptSoFar}` }] }],
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
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
    generationConfig: { maxOutputTokens: 512, temperature: 0.4 },
  })
  return result.response.text()
}
