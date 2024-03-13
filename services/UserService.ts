import { NewUser, UserLoginRequest } from "../models/General";
import bcrypt from "bcrypt";
import { generateResetToken, generateUserToken } from "../utils/UserUtils";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../middleware/ErrorHandler";
import jwt from "jsonwebtoken";
import UserQueries from "../queries/UserQueries";
import AWS from "aws-sdk";
import axios from "axios";

const RESET_TOKEN_TABLE = "dev_reset_token";
const RESET_TOKEN_EXPIRATION = 60 * 60 * 2; // 2 hours

class UserService {
  docClient = new AWS.DynamoDB.DocumentClient();

  async signupUser(user: NewUser): Promise<string> {
    // generate a random token with full alphabet and numbers not just hex no symbols
    const userToken = generateUserToken();

    // hash and salt the password
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    // store the user in the database

    const createdUser = await UserQueries.create(
      user.username,
      user.email,
      hashedPassword,
      userToken
    );

    if (!createdUser) {
      throw new InternalServerError("Error creating user");
    }
    const jwtoken = jwt.sign({ userToken }, process.env.SECRET_KEY!!, {
      expiresIn: "1w",
    });

    return await jwtoken;
  }

  async verifyUser(token: string): Promise<{ email: string; userToken: any }> {
    // retrieve the user from the database
    const payload = jwt.verify(token, process.env.SECRET_KEY!!) as any;
    console.log(payload);
    console.log(typeof payload);
    let email: string = "";

    if (payload.userToken) {
      const storedUser = await UserQueries.findByToken(payload.userToken);
      console.log("|||");
      console.log(storedUser);
      if (!storedUser) {
        throw new BadRequestError("No user found with that token");
      }
      email = storedUser.email;
    }

    return { email, userToken: payload.userToken };
  }

  async loginUser(
    user: UserLoginRequest
  ): Promise<{ jwtoken: string; userToken: string }> {
    // retrieve the user from the database
    const storedUser = await UserQueries.findByEmail(user.email);
    if (!storedUser) {
      throw new BadRequestError("No user found with that email");
    }
    // compare the passwords
    const match = bcrypt.compareSync(user.password, storedUser.password);

    if (!storedUser.password) {
      throw new BadRequestError("Please login using Google Auth");
    }

    if (!match) {
      throw new UnauthorizedError("Password and email do not match");
    }

    const jwtoken = jwt.sign(
      { userToken: storedUser.userToken },
      process.env.SECRET_KEY!!,
      { expiresIn: "1w" }
    );

    return { jwtoken, userToken: storedUser.userToken };
  }

  async loginGoogleAuthUser(
    access_token: string
  ): Promise<{ jwtoken: string; userToken: string; email: string }> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
          },
        }
      );

      const userProfile = response.data;

      // retrieve the user from the database
      const storedUser = await UserQueries.findByEmail(userProfile.email);

      if (storedUser?.password) {
        throw new BadRequestError("Please login using email and password");
      }

      var userToken = "";

      if (!storedUser) {
        // create a new user if player has signed on using google auth for the first time
        userToken = generateUserToken();

        // only story usertoken and email
        const [username, password] = ["", ""];

        const createdUser = await UserQueries.create(
          username,
          userProfile.email,
          password,
          userToken
        );

        if (!createdUser) {
          throw new InternalServerError("Error creating user");
        }
      }

      const jwtoken = jwt.sign(
        { userToken: storedUser ? storedUser.userToken : userToken },
        process.env.SECRET_KEY!!,
        { expiresIn: "1w" }
      );

      return {
        jwtoken,
        userToken: storedUser ? storedUser.userToken : userToken,
        email: userProfile.email,
      };
    } catch (error) {
      console.error("Error fetching user information from Google API:", error);
      throw new Error("Error fetching user information from Google API");
    }
  }

  async resetPassword(
    oldPassword: string,
    newPassword: string,
    userToken: string
  ): Promise<void> {
    // retrieve the user from the database
    const storedUser = await UserQueries.findByToken(userToken);
    if (!storedUser) {
      throw new BadRequestError("No user found with that token");
    }

    // compare the passwords
    const match = bcrypt.compareSync(oldPassword, storedUser.password);
    if (!match) {
      throw new UnauthorizedError("Password and email do not match");
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await UserQueries.updatePassword(hashedPassword, userToken);
  }

  async createResetToken(email: string): Promise<string> {
    const user = await UserQueries.findByEmail(email);
    if (!user) {
      throw new BadRequestError("No user found with that email");
    }

    const resetToken = generateResetToken();

    await this.docClient.put(
      {
        TableName: RESET_TOKEN_TABLE,
        Item: {
          token: resetToken,
          UserToken: user.userToken,
          ExpirationTime:
            Math.floor(Date.now() / 1000) + RESET_TOKEN_EXPIRATION,
        },
      },
      (err) => {
        if (err) {
          console.log("Error", err);
        }
      }
    );

    return resetToken;
  }

  async resetPasswordWithToken(
    newPassword: string,
    resetToken: string
  ): Promise<void> {
    const params = {
      TableName: RESET_TOKEN_TABLE,
      Key: {
        token: resetToken,
      },
    };

    const data = await this.docClient.get(params).promise();
    if (!data.Item) {
      throw new BadRequestError("Invalid reset token");
    }

    await this.docClient.delete(params, (err) => {
      if (err) {
        console.log("Error deleting reset key", err);
      }
    });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await UserQueries.updatePassword(hashedPassword, data.Item.UserToken);
  }
}

export default new UserService();
