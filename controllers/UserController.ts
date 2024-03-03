import { Jwt } from "jsonwebtoken";
import { InternalServerError } from "../middleware/ErrorHandler";
import { NewUser, UserLoginRequest, UserToken } from "../models/General";
import UserService from "../services/UserService";
import EmailService from "../services/EmailService";

class UserController {

    constructor() {}

    async signupUser(user: NewUser): Promise<string> {
        const jwtToken = await UserService.signupUser(user);
        if (!jwtToken) {
            throw new InternalServerError("Error creating user");
        }
        return jwtToken;
    }

    async verifyUser(token: string): Promise<string> {
        const email = await UserService.verifyUser(token);
        if (!email) {
            throw new InternalServerError("Error verifying user");
        }
        return email;
    }

    async loginUser(user: UserLoginRequest): Promise<string> {
        const jwtToken = await UserService.loginUser(user);
        if (!jwtToken) {
            throw new InternalServerError("Error logging in user");
        }
        return jwtToken;
    }

    async resetPassword(oldPassword: string, newPassword: string, userToken: UserToken): Promise<void> {
        return await UserService.resetPassword(oldPassword, newPassword, userToken);
    }

    async resetPasswordWithToken(newPassword: string, resetToken: string): Promise<void> {
        return await UserService.resetPasswordWithToken(newPassword, resetToken);
    }

    async forgotPassword(email: string): Promise<void> {
        const resetToken = await UserService.createResetToken(email);
        return await EmailService.sendPasswordResetEmail(email, resetToken);
    }
}

export default new UserController();