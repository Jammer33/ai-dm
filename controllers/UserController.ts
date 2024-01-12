import { Jwt } from "jsonwebtoken";
import { InternalServerError } from "../middleware/ErrorHandler";
import { NewUser, UserLoginRequest } from "../models/General";
import UserService from "../services/UserService";

class DungeonMasterController {

    constructor() {}

    async signupUser(user: NewUser): Promise<String> {
        const jwtToken = await UserService.signupUser(user);
        if (!jwtToken) {
            throw new InternalServerError("Error creating user");
        }
        return jwtToken;
    }

    async loginUser(user: UserLoginRequest): Promise<String> {
        const jwtToken = await UserService.loginUser(user);
        if (!jwtToken) {
            throw new InternalServerError("Error logging in user");
        }
        return jwtToken;
    }

}

export default new DungeonMasterController();