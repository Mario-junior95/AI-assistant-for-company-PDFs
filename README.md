# AI Assistant for Company PDFs

Next.js app for uploading company PDFs and chatting with an AI grounded in those documents.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route     | Description                    |
| --------- | ------------------------------ |
| `/`       | Chat — ChatGPT-style interface |
| `/upload` | Upload — drag & drop PDFs      |

## API

| Endpoint      | Method | Description |
| ------------- | ------ | ----------- |
| `/api/upload` | POST   | PDF → chunk → embed → Qdrant (`multipart/form-data`, field `files`) |
| `/api/chat`   | POST   | RAG chat — `{ messages }` → `{ message }` |
| `/api/hello`  | GET    | Sample route |

Copy `.env.example` to `.env.local`. Requires **OpenAI** and **Qdrant** running:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run start` | Run production server    |
| `npm run lint`  | Run ESLint               |
