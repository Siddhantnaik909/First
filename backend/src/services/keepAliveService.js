const http = require('http');
const https = require('https');
const { memoryStore } = require('../store/memoryStore');

let keepAliveInterval = null;

function performPing(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const options = {
            timeout: timeoutMs,
            headers: {
                'User-Agent': 'SmartHub-Uptime-Monitor/1.0.0'
            }
        };
        const req = client.get(url, options, (res) => {
            // Consume response data to free up memory
            res.on('data', () => {});
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve({ statusCode: res.statusCode });
                } else {
                    reject(new Error(`HTTP Status Code: ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Connection Timeout (15s)'));
        });
    });
}

async function pingSelf() {
    const port = process.env.PORT || 3000;
    const url = process.env.PUBLIC_URL || 
                (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}` : null) || 
                `http://localhost:${port}`;

    const startTime = Date.now();
    try {
        await performPing(`${url}/api/admin/client/settings`);
        const latency = Date.now() - startTime;
        
        memoryStore.keepAliveStats = {
            lastPingTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            lastPingStatus: 'success',
            latencyMs: latency,
            error: null
        };
    } catch (err) {
        const latency = Date.now() - startTime;
        memoryStore.keepAliveStats = {
            lastPingTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            lastPingStatus: 'failed',
            latencyMs: latency,
            error: err.message
        };
    }
}

function startKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    
    // Execute immediately on start
    pingSelf();
    
    // Run every 5 minutes (300000 ms)
    keepAliveInterval = setInterval(pingSelf, 5 * 60 * 1000);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
    memoryStore.keepAliveStats = {
        lastPingTime: null,
        lastPingStatus: 'stopped',
        latencyMs: null,
        error: null
    };
}

async function initKeepAlive(dbReady) {
    if (!dbReady) return;
    try {
        const UIState = require('../models/UIState');
        const state = await UIState.findOne({ key: 'global' });
        
        if (state && state.keepAliveEnabled) {
            startKeepAlive();
        } else {
            stopKeepAlive();
        }
    } catch (err) {
        console.error('[Uptime Monitor] Initialization failed:', err);
    }
}

module.exports = {
    initKeepAlive,
    startKeepAlive,
    stopKeepAlive
};
