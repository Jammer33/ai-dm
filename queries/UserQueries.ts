import { User } from "../db_models";
import { BadRequestError } from "../middleware/ErrorHandler";

class UserQueries {

    constructor() {}

    async create(username: string, email: string, hashedPassword: string, userToken: string): Promise<User> {
        // check if the user already exists
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new BadRequestError("Email is already in use");
        }

        const user = await User.create({
            username: username,
            email: email,
            password: hashedPassword,
            userToken: userToken,
        });

        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await User.findOne({
            where: {
                email: email,
            },
        });
        
        return user;
    }

    async findByToken(userToken: string): Promise<User | null> {
        const user = await User.findOne({
            where: {
                userToken: userToken,
            },
        });

        return user;
    }

    async updatePassword(hashedPassword: string, userToken: string): Promise<void> {
        await User.update({
            password: hashedPassword,
        }, {
            where: {
                userToken: userToken,
            },
        });
    }

    // return true if user exists
    async doesUserExist(userToken: string): Promise<boolean> {
        const user = await User.findOne({
            where: {
                userToken: userToken,
            },
        });

        return user !== null;
    }
}

export default new UserQueries();
