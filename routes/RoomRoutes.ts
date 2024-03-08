import express from 'express';
import { Request } from "express-jwt";
import RoomController from '../controllers/RoomController';
import RoomQueries from '../queries/RoomQueries';

const router = express.Router();

// find rooms for this user
router.get('/', async (req : Request, res) => {
    let userToken = req.auth?.userToken;
    if (!userToken) {
        return res.json([]);
    }
    console.log(userToken);

    const rooms = await RoomController.findPlayerRooms(userToken);
    let resData = [];
    for (let i = 0; i < rooms.length; i++) {
        resData.push(JSON.stringify({
            name: rooms[i].name,
            description: rooms[i].description,
            campaignToken: rooms[i].campaignToken,
            isOwner: rooms[i].ownerToken === userToken,
        }));
    }

    return res.json({message: JSON.stringify(resData)});
});

// delete a room
router.delete('/:campaignToken', async (req : Request, res) => {
    let userToken = req.auth?.userToken;
    let campaignToken = req.params.campaignToken;
    if (!userToken || !campaignToken) {
        return res.json({message: "could not delete the room"});
    }

    RoomController.deleteRoom(userToken, campaignToken).then(() => {
        return res.json({message: "room deleted"});
    }).catch((err) => {
        console.log("Could not delete the room: " + err);
        return res.json({message: "could not delete the room"});
    });
});

// check if user is part of the room
router.get('/isInRoom/:campaignToken', async (req : Request, res) => {
    let userToken = req.auth?.userToken;
    let campaignToken = req.params.campaignToken;
    if (!userToken || !campaignToken) {
        return res.json({message: "could not check"});
    }

    let isInRoom = await RoomQueries.isPlayerInRoom(userToken, campaignToken);
    return res.json({message: isInRoom});
});

export default router;