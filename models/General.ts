export interface User {
    id: number;
    userToken: UserToken;
    username: string;
    email: string;
}

export interface NewUser {
    username: string;
    password: string;
    email: string;
}

export interface NewUserWithToken extends NewUser {
    userToken: UserToken;
}

export interface UserLoginRequest {
    email: string;
    password: string;
}

// User token which is a string
export type UserToken = string;

export enum AccountStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    DELETED = "DELETED",
}