import { NewUser, UserLoginRequest } from "../models/General";
import bcrypt from "bcrypt";
import { generateUserToken } from "../utils/UserUtils";
import { BadRequestError, InternalServerError } from "../middleware/ErrorHandler";
import jwt from "jsonwebtoken";
import UserQueries from "../queries/UserQueries";

class UserService {
    async signupUser(user: NewUser): Promise<String> {
        // generate a random token with full alphabet and numbers not just hex no symbols
        const userToken = generateUserToken();


        // hash and salt the password
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        // store the user in the database

        const createdUser = await UserQueries.create(user.username, user.email, hashedPassword, userToken);

        if (!createdUser) {
            throw new InternalServerError("Error creating user");
        }
        const jwtoken = jwt.sign({ userToken }, process.env.SECRET_KEY!!, { expiresIn: '1w' })

        return await jwtoken;
    }

    async loginUser(user: UserLoginRequest): Promise<String> {
        // retrieve the user from the database
        const storedUser = await UserQueries.findByEmail(user.email);
        if (!storedUser) {
            throw new BadRequestError("No user found with that email");
        }
        // compare the passwords
        const match = bcrypt.compareSync(user.password, storedUser.password);
        if (!match) {
            throw new BadRequestError("Password and email do not match");
        }

        const jwtoken = jwt.sign({ userToken: storedUser.userToken }, process.env.SECRET_KEY!!, { expiresIn: '1w' })

        return await jwtoken;
    }
}

export default new UserService();