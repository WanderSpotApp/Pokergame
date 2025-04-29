# Poker Game

A multiplayer poker game built with React, Node.js, Express, Socket.io, and MongoDB.

## Deployment on Render.com

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Set the following environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_uri`
   - `PORT=10000`
   - `CORS_ORIGIN=https://your-render-app-name.onrender.com`

4. Build Command:
```
npm run install-all && npm run build
```

5. Start Command:
```
npm start
```

## Local Development

1. Install dependencies:
```
npm run install-all
```

2. Start the development server:
```
npm run dev
```

## Environment Variables

### Backend
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port
- `CORS_ORIGIN`: Allowed CORS origin

### Frontend
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_SOCKET_URL`: WebSocket URL 