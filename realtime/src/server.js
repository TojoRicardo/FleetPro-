import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  corsOriginValidator,
  parseAllowedOrigins,
  requireLocalInternalRequest,
  securityHeaders,
} from './security.js';

const PORT = Number(process.env.PORT || 6001);
const NODE_ENV = process.env.NODE_ENV || 'development';
const BIND_HOST = process.env.BIND_HOST ?? (NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN, NODE_ENV);
const INTERNAL_SECRET = process.env.REALTIME_INTERNAL_SECRET;

const WEAK_SECRETS = new Set([
  'fleetpro-realtime-dev',
  'your_realtime_secret_here',
  'change-me-to-a-long-random-secret',
]);

if (NODE_ENV === 'production' && (!INTERNAL_SECRET || WEAK_SECRETS.has(INTERNAL_SECRET))) {
  throw new Error('REALTIME_INTERNAL_SECRET must be set to a strong value in production.');
}

const effectiveSecret =
  INTERNAL_SECRET ?? (NODE_ENV === 'development' ? 'dev-local-only-unsafe' : null);

if (!effectiveSecret) {
  throw new Error('REALTIME_INTERNAL_SECRET is required.');
}

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(securityHeaders);
app.use(
  cors({
    origin: corsOriginValidator(allowedOrigins),
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests' },
  }),
);
app.use(express.json({ limit: '64kb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

/** channel -> Set<socketId> */
const channelMembers = new Map();

function joinChannel(socket, channel) {
  socket.join(channel);
  if (!channelMembers.has(channel)) channelMembers.set(channel, new Set());
  channelMembers.get(channel).add(socket.id);
}

app.get('/health', (_req, res) => {
  const payload = { status: 'ok' };
  if (NODE_ENV !== 'production') {
    payload.connections = io.engine.clientsCount;
  }
  res.json(payload);
});

/** Internal broadcast endpoint — called by Laravel backend */
app.post('/broadcast', requireLocalInternalRequest, (req, res) => {
  const auth = req.headers['x-realtime-secret'];

  if (auth !== effectiveSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { channel, event, data } = req.body ?? {};
  if (!channel || !event || typeof channel !== 'string' || typeof event !== 'string') {
    return res.status(422).json({ error: 'channel and event required' });
  }

  if (!/^(tenant|user)\.\d+$/.test(channel)) {
    return res.status(422).json({ error: 'invalid channel' });
  }

  io.to(channel).emit(event, data ?? {});
  return res.json({ delivered: true, channel, event });
});

io.on('connection', (socket) => {
  socket.on('subscribe', ({ channel }) => {
    if (!channel || typeof channel !== 'string') return;
    if (!/^(tenant|user)\.\d+$/.test(channel)) return;
    joinChannel(socket, channel);
  });

  socket.on('disconnect', () => {
    for (const members of channelMembers.values()) {
      members.delete(socket.id);
    }
  });
});

httpServer.listen(PORT, BIND_HOST, () => {
  if (NODE_ENV !== 'production') {
    process.stdout.write(`FleetPro realtime server listening on http://${BIND_HOST}:${PORT}\n`);
  }
});
