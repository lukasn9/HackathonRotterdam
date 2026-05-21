# EchoStream

> **Removing the barriers to participation**

EchoStream bridges the gap between presenters and their audiences through real-time, low-barrier engagement tools. Integrated with the **EventLabs** event transcription platform, it transforms passive listeners into active participants without requiring anyone to raise their hand.
> EchoStream was originally developed for a buildathon
---

## The Problem

Presentations are too often one-sided. Speakers struggle to gauge whether their content is landing, while audience members, held back by speaking anxiety, stay silent even when confused or disengaged.

| Engagement Metric | Traditional Lecture | With Tools Like EchoStream |
|---|---|---|
| Active Engagement Rate | 6.4% | 30.1% |
| Sense of Inclusivity | Baseline | 56% report higher inclusivity |
| Confidence in Asking Questions | Low (fear of ridicule) | 72% report higher confidence |
| Learning Effect (Test Score) | 5.3 / 10 | 6.6 / 10 |

*Source: [PMC Research Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11584206/)*

---

## The Solution

EchoStream integrates directly with EventLabs' live transcription tool, using the session transcript as the foundation for two key capabilities:

- **A real-time analytics dashboard** for presenters, surfacing audience reactions and question trends
- **An AI-powered chatbot** for attendees, enabling private Q&A grounded in what's actually being said

---

## Features

### Live Audience Reactions
Attendees can signal how they feel at any moment — **confused**, **bored**, **engaged**, or **surprised** — with a single tap. No interruptions, no speaking up.

### Presenter Dashboard
Reactions are aggregated and displayed in real time, giving speakers an immediate read of the room. Adapt your pace, revisit a topic, or open the floor to questions based on live feedback.

### AI-Powered Chatbot
Audience members can ask questions privately through an AI chatbot. Using **retrieval augmented generation (RAG)** over the live EventLabs transcript, responses are accurate and context-grounded.

### Proficiency-Aware Responses
At the start of each session, users set their knowledge level. The LLM tailors its answers accordingly: plain explanations for beginners, technical depth for experts.

### Question Classification
Incoming questions are automatically categorised by topic and surfaced on the presenter's dashboard, highlighting which subjects are generating the most confusion.

---

## Integrations

| Service | Purpose |
|---|---|
| **EventLabs** | Live transcript data powers the chatbot RAG pipeline and presenter analytics |

---

## Roadmap

The following features are planned for future iterations beyond the initial MVP:

- **AI-prompted live questions** — When the chatbot can't answer from the transcript, it will encourage the user to raise the question directly with the speaker, turning AI limitations into moments of human connection.
- **Periodic mood voting reminders** — Gentle nudges will prompt attendees to update their mood throughout the session, providing a continuous and representative stream of feedback rather than a single snapshot.

---

## Research & Background

EchoStream's design is informed by research on audience participation tools. Studies comparing traditional lectures to interactive polling platforms found significant improvements in engagement, inclusivity, and learning outcomes. See the full study: [PMC11584206](https://pmc.ncbi.nlm.nih.gov/articles/PMC11584206/).

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.
