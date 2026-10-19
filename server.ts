import express from 'express';
import { createServer as createViteServer } from 'vite';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMentorAdviceHandler } from './src/server/mentorEndpoint';
import { verifyFirebaseIdToken } from './src/server/firebaseAdmin';
import { getServerMentorAdvice } from './src/server/mentorAdvice';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local secrets stay on the server; deployed environment variables take precedence.
config({ path: [path.join(__dirname, '.env.local'), path.join(__dirname, '.env')], quiet: true });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: '256kb' }));
  app.post('/api/mentor-advice', createMentorAdviceHandler(verifyFirebaseIdToken, getServerMentorAdvice));

  // Use Vite's connect instance as middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve absolute paths from dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
