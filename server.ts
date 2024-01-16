import 'express-async-errors'; 
import { expressjwt } from 'express-jwt';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import https from 'https';
(async () => {
  await config({path: '.env'});
})();
import MemoryModule from './services/MemoryService';

import dungeonMasterRoutes from './routes/dungeonMaster';
import userRoutes from './routes/UserRoutes';
import accountRoutes from './routes/AccountRoutes';
import socket from './routes/WebSocket';
import { ErrorHandler, SocketErrorHandler } from './middleware/ErrorHandler';
import cookieParser from 'cookie-parser';
import "cookie-parser"
import fs from 'fs';
import AuthCheck from './middleware/AuthCheck';

declare module "jsonwebtoken" {
  export interface JwtPayload {
    userToken: string;
  }
}


const app = express();
const port = process.env.PORT || 3001;


app.use(bodyParser.json());
app.use(cors({
  origin: 'https://localhost:3000',
  credentials: true,
}))
app.use(cookieParser())

app.use('/user', userRoutes);
// Middleware to validate JWT and protect routes
app.use(expressjwt(
  { 
    secret: process.env.SECRET_KEY!!,
    algorithms: ['HS256'],
    getToken: function fromCookie(req) {
      if (req.cookies && req.cookies.token) {
          return req.cookies.token;
      }
      return undefined; // if there isn't any token
    },
  }
));

app.use(AuthCheck)

app.use('/account', accountRoutes);

app.use('/dungeon-master', dungeonMasterRoutes);
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post("/memories", async (req, res) => {
  const { memory, importance, sessionToken } = req.body;
  await MemoryModule.store(memory, importance, sessionToken);
  res.sendStatus(201);
});

app.post("/memories/search", async (req, res) => {
  const { query, sessionToken } = req.body;
  const memories = await MemoryModule.retrieveRecent(sessionToken);
  res.json(memories);
});

const privateKey = fs.readFileSync('keys/server.key', 'utf8');
const certificate = fs.readFileSync('keys/server.crt', 'utf8');

const server = https.createServer({ key: privateKey, cert: certificate }, app);

const io = new Server(server, {
  cookie: true,
  cors: {
    origin: 'https://localhost:3000',
    // allow cookies
    credentials: true,
  },
});

socket(io);

app.use(ErrorHandler);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
