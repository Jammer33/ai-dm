import express from 'express';
import UserController from '../controllers/UserController';

const router = express.Router();

// signup user
router.post('/signup', async (req, res) => {
    var { username, password, email } = req.body;
    const jwtToken = await UserController.signupUser({username, password, email});
    res.cookie('token', jwtToken, {
        httpOnly: false,
        secure: true, // Ensure you're running your server with HTTPS for this to work
        sameSite: 'lax'
    });
    return res.json({ message: "Successfully Signed Up" });
});

// login user
router.post('/login', async (req, res) => {
    console.log(req.cookies);
    var { email, password } = req.body;
    const jwtToken = await UserController.loginUser({email, password});
    res.cookie('token', jwtToken, {
        httpOnly: false,
        secure: true, // Ensure you're running your server with HTTPS for this to work
        sameSite: 'lax',
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24) // 1 day
    });
    return res.json({ message: "Successfully Logged In" });
});

// logout user
router.post('/logout', async (req, res) => {
    res.clearCookie('token');
    return res.json({ message: "Successfully Logged Out" });
});

// forgot password
router.post('/forgot-password', async (req, res) => {
    var { email } = req.body;
    await UserController.forgotPassword(email);
    return res.json({ message: "Successfully Sent Email" });
});

// reset password
router.post('/reset-password', async (req, res) => {
    var { password, resetToken } = req.body;

    await UserController.resetPasswordWithToken(password, resetToken);
    return res.json({ message: "Password Changed" });
});

export default router;