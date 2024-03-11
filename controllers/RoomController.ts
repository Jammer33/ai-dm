import RoomQueries from '../queries/RoomQueries';
import Room from '../db_models/GameRoom';
import { UnauthorizedError } from '../middleware/ErrorHandler';
import { Character } from '../models/Character';

class RoomController {
    // @createRoom creates a new room for the given user with this user token
    // returns a promise with the new campaignToken
    async createRoom(userToken: string, name: string, description: string, character: Character) : Promise<string> {
        let campaignToken = await RoomQueries.createRoom(userToken, name, description, character);
        return campaignToken;
    }

    // @joinRoom joins the room for the campaignToken
    async joinRoom(userToken: string, campaignToken: string, character: Character) : Promise<void> {
        RoomQueries.joinRoom(userToken, campaignToken, character);
    }

    async leaveRoom(userToken: string, campaignToken: string) {
        RoomQueries.leaveRoom(userToken, campaignToken ?? "");
    }

    async rejoinRoom(userToken: string, campaignToken: string) {
        await RoomQueries.rejoinRoom(userToken, campaignToken);
    }

    async findPlayerRooms(userToken: string) : Promise<Room[]> {
        return RoomQueries.findRoomsByPlayer(userToken);
    }

    async deleteRoom(userToken: string, campaignToken: string) : Promise<void> {
        if(!userToken) {
            console.log("Could not create a new room for campaignToken ");
            return;
        }

        let response = await RoomQueries.deleteRoom(userToken, campaignToken);
        console.log(campaignToken, userToken);
        console.log(response);
        if (response[0] === 0) {
            console.log("Could not delete the room");
            throw new UnauthorizedError("Could not delete the room");
        }

        return;
    }
}

export default new RoomController();