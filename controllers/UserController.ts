import { Jwt } from "jsonwebtoken";
import { InternalServerError } from "../middleware/ErrorHandler";
import { NewUser, UserLoginRequest, UserToken } from "../models/General";
import UserService from "../services/UserService";

class DungeonMasterController {

    constructor() {}

    async signupUser(user: NewUser): Promise<string> {
        const jwtToken = await UserService.signupUser(user);
        if (!jwtToken) {
            throw new InternalServerError("Error creating user");
        }
        return jwtToken;
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

}

export default new DungeonMasterController();