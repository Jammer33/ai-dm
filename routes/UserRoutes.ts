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
        sameSite: 'none' // or 'lax'
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
        sameSite: 'none', // or 'lax'
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24) // 1 day
    });
    return res.json({ message: "Successfully Logged In" });
});

export default router;