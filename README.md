# Markdown Note-Taking App with Chatbot & PDF Export

A full-stack markdown note-taking application built with **Vite + React + TypeScript + Tailwind** on the frontend and **Node.js + TypeScript** on the backend. The app supports:

- Creating, editing, and deleting markdown notes
- Theme switching (light/dark)
- Exporting notes to PDF
- Local storage for persistence
- Tagging notes
- Integrated chatbot for support

---

## ✨ Features

- 📝 **Markdown Editor**: Create and edit rich text notes with markdown syntax.
- 🌓 **Theme Toggle**: Switch between light and dark themes using a React context.
- 💾 **Local Storage**: Save notes in local storage for persistence.
- 🏷️ **Tagging**: Organize notes with tags.
- 🧠 **Chatbot Support**: Interactive chatbot component to help with questions or navigation.
- 📄 **Export to PDF**: Convert markdown notes to PDFs with server-side rendering.

---

## 🏗️ Tech Stack

### Frontend
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router DOM](https://reactrouter.com/en/main)
- [React Bootstrap](https://react-bootstrap.github.io/)
- CSS Modules
- Markdown rendering with [React Markdown](https://github.com/remarkjs/react-markdown)
- Chatbot with basic interaction
- LocalStorage for note persistence
- PDF generation using html2pdf.js

### Backend
- Node.js with TypeScript
- [Express](https://expressjs.com/)
- [Multer](https://github.com/expressjs/multer) for handling file uploads
- Groq API for Chatbot
- Cloudinary for cloud storage of Images
- [Node-fetch](https://github.com/node-fetch/node-fetch) for making HTTP requests

---

## 📁 Project Structure

```
notetake-ai/
├── client/
|   ├── index.html
|   ├── vite.config.ts            # Vite configuration
|   ├── package.json
|   ├── tsconfig*.json            
|   └── public/icon.svg
│   └── src/
│       ├── components/       # UI components including chatbot, notes, forms
│       ├── styles/           # CSS files
│       ├── types/            # Type definitions
│       ├── App.tsx
│       └── main.tsx
├── server/                   # Backend for Chatbot and Image storage
│   ├── index.ts
|   └── package.json
|   └── .env
|   └── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 16.x)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sk8011/notetake-ai.git
   cd notetake-ai
   ```

2. **Install dependencies**
   ```bash
   cd client && npm install
   ```

3. **Start the development server**
   ```bash
   cd client && npm run dev
   ```

4. **Run the backend**
   ```bash
   cd server
   npm install
   npm run build
   npm start
   ```

---

## 📦 Scripts

| Script         | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start frontend in dev mode |
| `npm run build`| Build frontend for production |
| `npm start`    | (Backend) Start PDF export server |

---

## 🛠️ Configuration

Set up a `.env` file in the root directory to configure environment-specific values. This may include:

```env
GROQ_API_KEY=****
CLOUDINARY_CLOUD_NAME=****
CLOUDINARY_API_KEY=****
CLOUDINARY_API_SECRET=****
```

---

## 📬 Contact

For issues, please open an issue on [GitHub](https://github.com/sk8011/notetake-ai/issues).
