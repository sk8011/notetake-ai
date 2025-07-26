# Copilot Instructions for Note-Taking App

## Project Overview
- This is a full-stack note-taking app built with React, TypeScript, Vite (client), and Node.js/Express (server).
- The client is in `client/src/` and the server in `server/`. The root contains config files for Vite, TypeScript, and ESLint.
- Notes are stored in localStorage on the client; the server provides an API endpoint for chatbot/AI features.

## Architecture & Data Flow
- **Client:**
  - Main entry: `client/src/main.tsx` and `App.tsx`.
  - Notes and tags are managed in `App.tsx` and passed via props/context.
  - Markdown rendering is handled by `MarkdownViewer.tsx` using `react-markdown`, with support for GFM and raw HTML.
  - Export features (PDF/HTML) use `html2pdf.js` or Blob APIs, referencing rendered HTML via React refs.
  - Routing is managed by `react-router-dom`.
- **Server:**
  - Main entry: `server/index.ts`.
  - Provides `/api/chat` endpoint for AI/chatbot integration (Groq API).
  - Uses `node-fetch` for external API calls.

## Developer Workflows
- **Build:**
  - Use `npm run dev` for local development (Vite HMR).
  - Use `npm run build` to create production assets.
- **Linting:**
  - ESLint config in `eslint.config.js`. Type-aware linting recommended (see README for config).
- **TypeScript:**
  - Multiple `tsconfig` files: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`.
- **Testing:**
  - No test files detected; add tests in `client/src/__tests__` or similar if needed.

## Patterns & Conventions
- Use React functional components and hooks throughout.
- Pass refs to components (e.g., `MarkdownViewer`) using `React.forwardRef` for export features.
- Markdown content is rendered and exported as HTML or PDF; images/videos may require special handling for export.
- All major UI logic is in `client/src/`, with clear separation of concerns (note list, note view, note form, chatbot).
- API integration is via fetch calls to the server; server proxies requests to Groq API.

## Integration Points
- External dependencies: `react-markdown`, `remark-gfm`, `rehype-raw`, `html2pdf.js`, `react-bootstrap`, `react-router-dom`, `node-fetch` (server).
- Chatbot/AI: Server-side `/api/chat` endpoint integrates with Groq API; client-side `Chatbot.tsx` interacts with this endpoint.

## Examples
- To export a note as HTML: use a ref to the rendered Markdown and Blob APIs in `Note.tsx`.
- To add a new note: update state in `App.tsx`, pass props to `NewNote.tsx`.
- To extend Markdown rendering: update `MarkdownViewer.tsx` with new plugins/components.

---

If any section is unclear or missing, please provide feedback so this guide can be improved for future AI agents.
