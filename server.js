/**
 * Simple Frontend Server
 * - Serves Next.js frontend
 * - Proxies API calls to backend
 * - No WhatsApp engine logic
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Load API config
let API_BASE_URL, WHATSAPP_ENGINE_URL;
try {
    const config = require('./src/config/api.js');
    API_BASE_URL = config.API_BASE_URL;
    WHATSAPP_ENGINE_URL = config.WHATSAPP_ENGINE_URL;
} catch (err) {
    API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    WHATSAPP_ENGINE_URL = process.env.NEXT_PUBLIC_WHATSAPP_ENGINE_URL || 'http://localhost:3002';

}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configuration
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'frontend',
        port: FRONTEND_PORT,
        uptime: process.uptime(),
        pid: process.pid,
        memory: process.memoryUsage()
    });
});

// Proxy API calls to backend
app.use('/api/*', async (req, res) => {
    try {
        const targetUrl = `${API_BASE_URL}${req.path}`;
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: {
                ...req.headers,
                host: new URL(API_BASE_URL).host
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Proxy error', message: error.message });
        }
    }
});

// Start server
app.listen(FRONTEND_PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend Server STARTED`);
    console.log(`📡 Frontend running on port ${FRONTEND_PORT}`);
    console.log(`🔗 API Proxy to: ${API_BASE_URL}`);
    console.log(`📱 WhatsApp Engine at: ${WHATSAPP_ENGINE_URL}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received - shutting down gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received - shutting down gracefully');
    process.exit(0);
});
