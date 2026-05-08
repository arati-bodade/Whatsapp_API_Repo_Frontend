# WhatsApp Engine Integration Guide

## Overview

The WhatsApp Engine has been successfully integrated into the frontend backend as a single Node.js process. This eliminates the need for separate servers and provides a unified development experience.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Frontend (Next.js)                        │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │   React UI      │  │      WhatsApp Service         │ │
│  │   Components    │  │      (useWhatsApp Hook)       │ │
│  └─────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │ HTTP API
                            ▼
┌─────────────────────────────────────────────────────────┐
│            Unified Backend Server (server.js)           │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │   Express API   │  │      WhatsApp Engine         │ │
│  │   Routes        │  │      (Baileys + Sessions)    │ │
│  └─────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              WhatsApp Sessions Storage                   │
│         (whatsapp_sessions/ folder)                     │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### ✅ **Single Process Architecture**
- WhatsApp Engine runs inside the frontend backend
- No separate server processes to manage
- Unified development and deployment

### ✅ **Persistent Sessions**
- Sessions stored in `whatsapp_sessions/` folder
- Auto-restore on server restart
- No QR re-scan required for existing sessions

### ✅ **Auto-Reconnection**
- Automatic reconnection on network issues
- Exponential backoff retry logic
- Graceful handling of WhatsApp disconnections

### ✅ **Comprehensive Health Checks**
- `/health` endpoint with detailed status
- Real-time session monitoring
- Memory and uptime tracking

### ✅ **Crash Protection**
- Global error handlers prevent crashes
- Unhandled promise rejection protection
- Graceful error recovery

### ✅ **QR Management**
- QR generated only when needed
- QR caching with automatic cleanup
- First-time login optimization

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "engine": "running",
  "port": 3002,
  "total_sessions": 1,
  "connected": 1,
  "qr_ready": 0,
  "uptime": 3600,
  "pid": 12345,
  "memory": {...},
  "initialized": true,
  "whatsapp": "connected",
  "message": "WhatsApp engine is connected and ready"
}
```

### Get All Sessions
```http
GET /sessions
```

### Get QR Code
```http
GET /session/:deviceId/qr
```

### Get Device Status
```http
GET /session/:deviceId/status
```

### Send Message
```http
POST /session/:deviceId/message
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Hello World",
  "type": "text"
}
```

### Reconnect Device
```http
POST /session/:deviceId/reconnect
```

## Usage

### Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Full Stack**
   ```bash
   npm run dev:full
   ```
   This starts both the WhatsApp Engine server (port 3002) and Next.js dev server (port 3000).

3. **Start Only WhatsApp Engine**
   ```bash
   npm run server
   ```

4. **Start Only Frontend**
   ```bash
   npm run dev
   ```

### Frontend Integration

```javascript
import useWhatsApp from '@/hooks/useWhatsApp';

function WhatsAppComponent() {
  const { 
    status, 
    qr, 
    isLoading, 
    error, 
    isConnected,
    initializeSession,
    sendMessage,
    reconnect 
  } = useWhatsApp('device-123');

  const handleSendMessage = async () => {
    try {
      await sendMessage('+1234567890', 'Hello from WhatsApp!');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div>
      {status === 'qr_ready' && qr && (
        <img src={`data:image/png;base64,${qr}`} alt="QR Code" />
      )}
      
      {isConnected && (
        <button onClick={handleSendMessage}>
          Send Message
        </button>
      )}
      
      {status === 'disconnected' && (
        <button onClick={initializeSession}>
          Connect WhatsApp
        </button>
      )}
    </div>
  );
}
```

### Testing

Run the integration test suite:
```bash
node test-integration.js
```

## Environment Variables

```env
# WhatsApp Engine Configuration
WHATSAPP_PORT=3002
NEXT_PUBLIC_WHATSAPP_ENGINE_URL=http://localhost:3002

# Next.js Configuration
PORT=3000
```

## Session Persistence

- **Location**: `whatsapp_sessions/` folder
- **Format**: Multi-file auth state (Baileys)
- **Auto-restore**: On server restart
- **Cleanup**: Automatic on logout

## Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
netstat -an | grep 3002

# Kill existing process
lsof -ti:3002 | xargs kill -9
```

### QR Not Generating
1. Check device ID format
2. Verify sessions folder permissions
3. Check engine health: `curl http://localhost:3002/health`

### Messages Not Sending
1. Verify device is connected
2. Check phone number format
3. Review engine logs

### Session Not Persisting
1. Check `whatsapp_sessions/` folder exists
2. Verify write permissions
3. Check for session corruption

## Migration from Separate Engine

If you're migrating from the separate WhatsApp engine:

1. **Copy Sessions**: Move `auth_info/` to `whatsapp_sessions/`
2. **Update URLs**: Change from `localhost:3001` to `localhost:3002`
3. **Update Package**: Remove duplicate WhatsApp engine folder
4. **Update Scripts**: Use `npm run dev:full` instead of separate processes

## Production Deployment

1. **Build Frontend**: `npm run build`
2. **Start Production**: `npm start`
3. **Use Process Manager**: PM2 or similar for stability
4. **Configure Reverse Proxy**: Nginx for SSL and load balancing

## Security Considerations

- **CORS**: Configured for development
- **Rate Limiting**: Implement for production
- **Authentication**: Add API key validation
- **Session Encryption**: Sessions stored locally, consider encryption

## Support

For issues:
1. Check integration test results
2. Review engine logs
3. Verify session files
4. Test with different devices
