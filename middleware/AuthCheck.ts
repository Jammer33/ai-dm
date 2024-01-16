import { NextFunction } from "express";
import { Request } from "express-jwt";
import { UnauthorizedError } from "./ErrorHandler";


const AuthCheck = (req: any, res: any, next: NextFunction) => {
    if (req.auth?.userToken) {
        return next();
    }
    
    throw new UnauthorizedError("Authentication error: No user token provided.");
}

export default AuthCheck;