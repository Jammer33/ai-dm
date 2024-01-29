import express from 'express';
import { Request } from "express-jwt";
import RoomController from '../controllers/RoomController';

const router = express.Router();

// find rooms for this user
router.get('/', async (req : Request, res) => {
    let userToken = req.auth?.userToken;
    if (!userToken) {
        return res.json([]);
    }
    console.log(userToken);

    const rooms = await RoomController.findPlayersInRoom(userToken);
    let resData = [];
    for (let i = 0; i < rooms.length; i++) {
        resData.push({
            name: rooms[i].name,
            description: rooms[i].description,
            sessionToken: rooms[i].sessionToken,
        });
    }
    console.log(resData);
    return res.json(resData);
});

export default router;