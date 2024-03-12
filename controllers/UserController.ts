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

  async verifyUser(token: string): Promise<{ email: string; userToken: any }> {
    const response = await UserService.verifyUser(token);
    if (!response.email) {
      throw new InternalServerError("Error verifying user");
    }
    return response;
  }

  async loginUser(
    user: UserLoginRequest
  ): Promise<{ jwtoken: string; userToken: string }> {
    const response = await UserService.loginUser(user);
    if (!response.jwtoken) {
      throw new InternalServerError("Error logging in user");
    }
    return response;
  }

  async loginGoogleAuthUser(
    user: UserLoginRequest
  ): Promise<{ userToken: string }> {
    const response = await UserService.loginGoogleAuthUser(user);
    if (!response.userToken) {
      throw new InternalServerError("Error logging in user");
    }
    return response;
  }

  async resetPassword(
    oldPassword: string,
    newPassword: string,
    userToken: UserToken
  ): Promise<void> {
    return await UserService.resetPassword(oldPassword, newPassword, userToken);
  }

  async resetPasswordWithToken(
    newPassword: string,
    resetToken: string
  ): Promise<void> {
    return await UserService.resetPasswordWithToken(newPassword, resetToken);
  }

  async forgotPassword(email: string): Promise<void> {
    const resetToken = await UserService.createResetToken(email);
    return await EmailService.sendPasswordResetEmail(email, resetToken);
  }
}

export default new UserController();
