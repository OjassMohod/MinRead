# minread

Know what changed and what needs your attention without reading every chat message.

minread is a planned cloud-powered chat catch-up app: paste a conversation, enter
your name, and receive prioritized tasks, deadlines, decisions, and a brief summary
with links to supporting messages.

## Current status

Steps 1 and 2 are complete: MVP scope and architecture are documented, and 12
labeled synthetic evaluation conversations are available. The app is not yet
implemented or deployed, and model inference has not been verified.

- [Scope, architecture, security requirements, and implementation sequence](PROJECT_PLAN.md)
- [Synthetic dataset and evaluation instructions](datasets/synthetic/README.md)

## Planned implementation

Next.js, TypeScript, Zod, and server-side OpenAI inference, targeting Vercel.
The server will use `CHAT_MODEL_API_KEY`; credentials must never appear in browser
code or Git. Public deployment needs its own secure server-side binding.

## Privacy boundary

Analysis will send conversation text through the application backend to the model
provider after the user clicks Analyze. The design avoids application conversation
storage and content logging. Provider/hosting retention policies still apply;
this is not an on-device or risk-free system. Use synthetic or non-sensitive chats
for development and demonstrations.

## Repository name

The project name is **minread** and the repository is `OjassMohod/MinRead`.
The local checkout folder can retain its existing name without affecting the app.
Git read access to the renamed repository has been verified, and the origin is
`https://github.com/OjassMohod/MinRead.git`.
