import jwt from 'jsonwebtoken';
import {parse} from 'cookie';
import cookieParser from 'cookie-parser';
import { UnauthorizedError } from './ErrorHandler';
import { Socket } from 'socket.io';

declare module "socket.io" {
    interface Socket {
        decoded: any; 
    }
}

const socketAuth = (socket: any, next: any) => {
    console.log("socketAuth");
    if (socket.handshake.headers.cookie) {
        // Parse cookies
        const cookies = cookieParser.JSONCookies(parse(socket.handshake.headers.cookie));

        // Get the JWT token from the cookie
        const token = cookies.token as unknown as string;  // Assuming the JWT token is stored in a cookie named "token"

        if (!token) {
            socket.emit('error', 'Authentication error: No token provided.');
            return next(new UnauthorizedError('Authentication error: No token provided.'));

        }

        // Verify the JWT
        jwt.verify(token, process.env.SECRET_KEY!!, (err, decoded) => {
            if (err) {
                socket.emit('error', 'Authentication error: Token is invalid.');
                next(new UnauthorizedError('Authentication error: Token is invalid.'));
            }
            
            // Store the decoded payload so that it can be used in other parts of the application
            socket.decoded = decoded;
            console.log("Socket Auth Success")
            return next();
        });
    } else {
        socket.emit('error', 'Authentication error: No cookie provided.');
        return next(new UnauthorizedError('Authentication error: No cookie provided.'));
    }
}

export default socketAuth;
