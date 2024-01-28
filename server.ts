import 'express-async-errors'; 
import { expressjwt } from 'express-jwt';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import https from 'https';
import http from 'http';
(async () => {
  await config({path: '.env'});
})();

import dungeonMasterRoutes from './routes/dungeonMaster';
import userRoutes from './routes/UserRoutes';
import accountRoutes from './routes/AccountRoutes';
import socket from './routes/WebSocket';
import { ErrorHandler } from './middleware/ErrorHandler';
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

const allowedOrigins = ['https://wizardgm.ai', 'https://staging.wizardgm.ai', 'https://www.wizardgm.ai'];


app.use(bodyParser.json());
// allow requests from wizardgm.ai and staging.wizardgm.ai
if (process.env.NODE_ENV === 'dev') {
  app.use(cors({
    origin: 'https://localhost:3000',
    credentials: true,
  }))
} else if (process.env.NODE_ENV === 'staging') {
  app.use(cors({
    origin: function(origin, callback) {
      if (origin === undefined) return callback(new Error('origin undefined'));

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(origin);
        callback(new Error(origin + ' not allowed by CORS'));
      }
    },
    credentials: true,
  }))
} else {
  app.use(cors({
    origin: function(origin, callback) {
      if (origin === undefined) return callback(new Error('origin undefined'));

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(origin);
        callback(new Error(origin + ' not allowed by CORS'));
      }
    },
    credentials: true,
  }))
}

app.use(cookieParser())

// Public User Routes
app.use('/user', userRoutes);

app.get('/health', (req, res) => {
  // return 200
  res.sendStatus(200);
});


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
).unless({path: ['/user/signup', '/user/login', '/user/forgot-password', '/user/reset-password']})
);

app.use(AuthCheck)

app.use('/account', accountRoutes);

app.use('/dungeon-master', dungeonMasterRoutes);

const isDev = process.env.NODE_ENV === 'dev';

let server;

if (!isDev) {
  // In production, let's expect that SSL termination is handled by AWS (ALB, etc.)
  server = http.createServer(app);
} else {
  // In development, use local SSL certificates for testing HTTPS
  const privateKey = fs.readFileSync('keys/server.key', 'utf8');
  const certificate = fs.readFileSync('keys/server.crt', 'utf8');
  const credentials = { key: privateKey, cert: certificate };

  server = https.createServer(credentials, app);
}


let serverConfig;
if (isDev) {
  serverConfig = {
    cookie: true,
    cors: {
      origin: "https://localhost:3000",
      credentials: true,
    },
  };
} else if (process.env.NODE_ENV == 'staging') {
  serverConfig = {
    cookie: true,
    cors: {
      origin: (origin: any, callback: any) => {
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log(origin);
          callback(new Error(origin + ' not allowed by CORS'));
        }
      },
      credentials: true,
    },
  };
} else {
  serverConfig = {
    cookie: true,
    cors: {
      origin: (origin: any, callback: any) => {
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log(origin);
          callback(new Error(origin + ' not allowed by CORS'));
        }
      },
      credentials: true,
    },
  };
}

const io = new Server(server, serverConfig);

socket(io);

app.use(ErrorHandler);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
