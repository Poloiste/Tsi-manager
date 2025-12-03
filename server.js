// server.js - use this if you want to deploy front + server on Render (or any Node host).
// Installs: npm i express helmet cookie-parser
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
const BUILD_DIR = path.join(__dirname, 'frontend', 'build');

// Helmet default + CSP customization (adapt connect-src etc)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      connectSrc: ["'self'", 'https://your-project.supabase.co', 'https://tsi-manager-backend.onrender.com', 'https://api.openai.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      frameAncestors: ["'none'"],
    }
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  noSniff: true,
}));

app.use(cookieParser());

// Serve static assets first (public, no auth)
app.use(express.static(BUILD_DIR, {
  setHeaders: (res, filePath) => {
    // Apply caching/security headers for all static assets
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    // Manifest content type for safety (optional)
    if (filePath.endsWith('manifest.json')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
  }
}));

// Example auth-check middleware for API routes only:
function requireAuthForApi(req, res, next) {
  // Example: check HttpOnly cookie named 'session'
  const token = req.cookies && req.cookies.session;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: validate token (JWT verification or session lookup)
  next();
}

// Protect API routes only (change prefix if your API differs)
app.use('/api/private', requireAuthForApi);

// Example API route (public)
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
