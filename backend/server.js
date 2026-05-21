const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { config } = require('./src/config/env');

if (process.env.DISABLE_CONSOLE_LOGS === 'true') {
    console.log('🔇 Console logs disabled globally by env configuration.');
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
}

console.time('startup');
console.log('🚀 Server starting...');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: (origin, callback) => {
            const allowed = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                `http://${LOCAL_IP}:3000`,
                process.env.FRONTEND_URL,
                process.env.RENDER_EXTERNAL_URL,
                process.env.NGROK_URL,
                process.env.LOCALTUNNEL_URL
            ].filter(Boolean);
            if (!origin || allowed.includes(origin) || origin.endsWith('.onrender.com')) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true 
    } 
});
const PORT = process.env.PORT || 3000;
const LOCAL_IP = process.env.LOCAL_IP || '192.168.29.76';
app.locals.io = io;

// Socket event handler registration
const initGameSockets = require('./src/sockets/gameSockets');
initGameSockets(io);

// Security Middleware
app.use(require('helmet')({ contentSecurityPolicy: false }));


// Only log errors (4xx/5xx) — suppress noisy 200/304 access logs

app.use(require('morgan')('combined', {
    skip: (req, res) => res.statusCode < 400
}));


// Rate limiting for auth routes
const authLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP
  message: { error: 'Too many login attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per windowMs per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsers AFTER security
// ✅ FIX: Explicit CORS origin allowlist (not wildcard)
app.use(cors({
    origin: (origin, callback) => {
        const allowed = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:5501',
            'http://127.0.0.1:5501',
            `http://${LOCAL_IP}:3000`,
            process.env.FRONTEND_URL,
            process.env.RENDER_EXTERNAL_URL, // Live Render production URL
            process.env.NGROK_URL,
            process.env.LOCALTUNNEL_URL
        ].filter(Boolean);
        
        // Allow same-origin requests, whitelisted origins, or any subdomain on Render
        if (!origin || allowed.includes(origin) || origin.endsWith('.onrender.com') || origin.startsWith('http://192.168.')) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



// --- Static File Serving ---
const publicPath = path.join(__dirname, '../frontend/public');
const componentsPath = path.join(publicPath, 'components');

// ✅ FIX: Proper Cache-Control headers per asset type
const staticOptions = {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            // HTML: always revalidate — shows new content immediately
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(js|css)$/)) {
            // JS/CSS: revalidate — ensures code changes are visible
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)$/)) {
            // Images/fonts: cache 1 day (safe — these rarely change)
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
};

// --- Universal HTML Rewrite & Redirection Middleware ---
app.use((req, res, next) => {
    // 1. If requesting a top-level .html file with /calculators/ prefix (e.g., /calculators/GameLobby.html)
    if (req.path.startsWith('/calculators/') && req.path.endsWith('.html')) {
        const parts = req.path.split('/');
        const fileName = parts[parts.length - 1];
        // Check if this file exists directly in the public root folder
        const rootFilePath = path.join(publicPath, fileName);
        if (fs.existsSync(rootFilePath)) {
            // Redirect cleanly to the root version without .html (e.g., /GameLobby)
            const cleanName = fileName.replace(/\.html$/, '');
            return res.redirect(301, `/${cleanName}`);
        }
    }

    // 2. Redirect any direct .html request to its clean URL equivalent
    // (e.g., /login.html -> /login, /about.html -> /about)
    // Make sure we exclude static resources like /components/ or /uploads/ or /backend/
    if (req.path.endsWith('.html') && !req.path.startsWith('/components/') && !req.path.startsWith('/uploads/')) {
        const fileName = path.basename(req.path);
        const cleanName = req.path.substring(0, req.path.length - 5); // strip .html
        
        // Special case: index.html -> /
        if (fileName.toLowerCase() === 'index.html') {
            return res.redirect(301, '/');
        }
        
        // Redirect to clean path
        return res.redirect(301, cleanName);
    }

    next();
});

app.use(express.static(publicPath, staticOptions));
app.use('/components', express.static(componentsPath, staticOptions));
app.use('/uploads', express.static(path.join(publicPath, 'uploads'), staticOptions));
app.use('/backend/css', express.static(path.join(__dirname, 'css'), staticOptions));
app.use('/backend/js', express.static(path.join(__dirname, 'js'), staticOptions));

// Start server FIRST before heavy operations
server.listen(PORT, '0.0.0.0', () => {
console.log(`✅ Server running on port ${PORT} (0.0.0.0)`);
    console.log(`🌐 Localhost: http://localhost:${PORT}`);
    console.log(`🌐 LAN Access: http://${LOCAL_IP}:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.timeEnd('startup');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in backend/.env.`);
    process.exit(1);
  }
  console.error('Server startup error:', err.message);
  process.exit(1);
});

// MongoDB with retry (async - doesn't block server)
const connectWithRetry = (retries = 10) => {
  mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  }).then(() => {
    console.log('✅ MongoDB connected');
    app.locals.dbReady = mongoose.connection;
    app.locals.db = mongoose.connection.db;
    try {
        const { initKeepAlive } = require('./src/services/keepAliveService');
        initKeepAlive(mongoose.connection);
    } catch (kaErr) {
        console.error('Failed to boot keep alive service:', kaErr);
    }
  }).catch(err => {
    console.error(`❌ MongoDB Attempt ${11-retries} failed:`, err.message);
    if (retries > 0) {
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    } else {
      console.error('❌ MongoDB connection failed after all retries');
    }
  });
};
connectWithRetry();

// --- API Routes ---
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./routes/admin'); 
const catalogRoutes = require('./src/routes/catalogRoutes'); 
const historyRoutes = require('./src/routes/historyRoutes'); 
const uiRoutes = require('./src/routes/uiRoutes');
const connectorRoutes = require('./src/routes/connectorRoutes');
const gameRoutes = require('./src/routes/gameRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const saasRoutes = require('./src/routes/saasRoutes');

// Public API for sidebar features (Fixes the ERR_CONNECTION_REFUSED)
app.get('/api/admin/client/features', (req, res) => {
    res.json([]); // Return empty for now to satisfy the fetch
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ui', uiRoutes);
app.use('/api/connectors', connectorRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/saas', saasRoutes);

// ── Clean URL routes (no .html extension needed) ─────────────────────────────
// Calculators hub — /calculators and /calculators/ both serve calculators.html
app.get(['/calculators', '/calculators/'], (req, res) => {
    res.sendFile(path.join(publicPath, 'calculators.html'));
});

// Dynamic Clean URLs for Sub-calculators (e.g. /calculators/electronics/calc_555_timer)
app.get(['/calculators/:category/:tool', '/calculators/:category/:tool/'], (req, res, next) => {
    const { category, tool } = req.params;
    if (tool.includes('.')) return next();
    const filePath = path.join(publicPath, 'calculators', category, `${tool}.html`);
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    next();
});

// Game lobby pages
app.get('/GameLobby', (req, res) => res.sendFile(path.join(publicPath, 'GameLobby.html')));
app.get('/CreateGameLobby', (req, res) => res.sendFile(path.join(publicPath, 'CreateGameLobby.html')));
app.get('/JoinGameLobby', (req, res) => res.sendFile(path.join(publicPath, 'JoinGameLobby.html')));

// Other top-level pages
app.get('/login',    (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/signup',   (req, res) => res.sendFile(path.join(publicPath, 'signup.html')));
app.get('/profile',  (req, res) => res.sendFile(path.join(publicPath, 'profile.html')));
app.get('/history',  (req, res) => res.sendFile(path.join(publicPath, 'history.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(publicPath, 'settings.html')));
app.get('/contact',  (req, res) => res.sendFile(path.join(publicPath, 'contact.html')));
app.get('/about',    (req, res) => res.sendFile(path.join(publicPath, 'about.html')));
app.get('/admin',    (req, res) => res.sendFile(path.join(publicPath, 'admin.html')));
app.get('/AdminDashboard', (req, res) => res.sendFile(path.join(publicPath, 'AdminDashboard.html')));
app.get('/admin_mobile_trace', (req, res) => res.sendFile(path.join(publicPath, 'admin_mobile_trace.html')));
app.get('/auth-callback', (req, res) => res.sendFile(path.join(publicPath, 'auth-callback.html')));

app.get('/privacy', (req, res) => res.sendFile(path.join(publicPath, 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(publicPath, 'terms.html')));



// --- RDAP/Whois Proxy (Bypass CORS) ---
const rdapLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 50, // 50 req/IP
  message: 'Too many RDAP requests, slow down.'
});
app.get('/api/proxy/rdap', rdapLimiter, (req, res) => {
    const { target, mode } = req.query;
    if (!target) return res.status(400).json({ error: 'Target is required' });

    const fetchRdap = (url, depth = 0) => {
        if (depth > 5) return res.status(500).json({ error: 'Too many redirects' });

        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0 (SmartHub Lookup Tool)' }
        };

        https.get(url, options, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return fetchRdap(response.headers.location, depth + 1);
            }

            if (response.statusCode !== 200) {
                return res.status(response.statusCode).json({ error: `RDAP Server returned ${response.statusCode} for ${url}` });
            }

            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    res.json(JSON.parse(data));
                } catch (e) {
                    res.status(500).json({ error: 'Failed to parse RDAP response' });
                }
            });
        }).on('error', (err) => {
            res.status(500).json({ error: err.message });
        });
    };

    const initialUrl = mode === 'network' ? `https://rdap.org/ip/${target}` : `https://rdap.org/domain/${target}`;
    fetchRdap(initialUrl);
});


// Root Redirect
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 Handler - Must be after all other routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(err.status || 500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    // ${signal} received, shutting down gracefully
    
    try {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) reject(err);
                else {
    // Server closed
                    resolve();
                }
            });
        });
        
        await mongoose.connection.close(false);
    // MongoDB connection closed
        process.exit(0);
    } catch (err) {
        console.error('Shutdown error:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

