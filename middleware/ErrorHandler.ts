import { Request, Response, NextFunction } from 'express';
import socket from '../routes/WebSocket';

const ErrorHandler = (err: CustomError | Error, req: Request, res: Response, next: NextFunction) => {
    // If the error is not an instance of CustomError, default to InternalServerError
    let error: CustomError = err as CustomError;
    if (!(err instanceof CustomError)) {
        error = new InternalServerError(err.message);
    }

    // Environment-based Handling & Logging
    if (process.env.NODE_ENV === 'production') {
        console.error(err); // Logging
    } else {
        console.log(err.stack); // Stack trace for development
    }

    const errorResponse = {
        error: {
            code: error.statusCode,
            message: error.message,
        }
    };

    res.status(error.statusCode).send(errorResponse);
};
// Socket.io error-handling middleware
const SocketErrorHandler = (socket: any, next: any) => (err: CustomError) => {
    // Environment-based Handling & Logging
    if (process.env.NODE_ENV === 'production') {
        if (!err.statusCode) err = new InternalServerError(); // Default to 500 error for unexpected issues
        console.error(err); // Logging
    } else {
        console.log(err.stack); // Stack trace for development
    }

    const errorResponse = {
        error: {
            code: err.statusCode,
            message: err.message,
        }
    };

    socket.emit('error', errorResponse);
    next();
};

// Base CustomError abstract class
abstract class CustomError extends Error {
    abstract statusCode: number;

    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, CustomError.prototype);
    }

    abstract serializeErrors(): { message: string; field?: string }[];
}

// Derived error classes
class BadRequestError extends CustomError {
    statusCode = 400;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class UnauthorizedError extends CustomError {
    statusCode = 401;
    constructor(public message: string = 'Not authorized') {
        super(message);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class ForbiddenError extends CustomError {
    statusCode = 403;
    constructor(public message: string = 'Forbidden') {
        super(message);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class NotFoundError extends CustomError {
    statusCode = 404;
    constructor(public message: string = 'Resource not found') {
        super(message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class MethodNotAllowedError extends CustomError {
    statusCode = 405;
    constructor(public message: string = 'Method not allowed') {
        super(message);
        Object.setPrototypeOf(this, MethodNotAllowedError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class ConflictError extends CustomError {
    statusCode = 409;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class UnsupportedMediaTypeError extends CustomError {
    statusCode = 415;
    constructor(public message: string = 'Unsupported media type') {
        super(message);
        Object.setPrototypeOf(this, UnsupportedMediaTypeError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class InternalServerError extends CustomError {
    statusCode = 500;
    constructor(public message: string = 'Internal server error') {
        super(message);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

class NotImplementedError extends CustomError {
    statusCode = 501;
    constructor(public message: string = 'Not implemented') {
        super(message);
        Object.setPrototypeOf(this, NotImplementedError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}

// Export the error handling middleware and custom errors
export {
    ErrorHandler,
    SocketErrorHandler,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    MethodNotAllowedError,
    ConflictError,
    UnsupportedMediaTypeError,
    InternalServerError,
    NotImplementedError
};
