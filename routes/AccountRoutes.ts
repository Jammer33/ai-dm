import express from "express";
import UserController from "../controllers/UserController";
import { Request } from "express-jwt";

const router = express.Router();

router.post('/change-password', async (req: Request, res) => {
    const { oldPassword, newPassword } = req.body;
    const userToken = req.auth!.userToken;

    await UserController.resetPassword(oldPassword, newPassword, userToken);
    return res.json({ message: "Password Changed" });
});

export default router;