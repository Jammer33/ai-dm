import UserQueries from '../queries/UserQueries';
import RoomService from '../services/RoomService';

class RoomController {
    // @createRoom creates a new room for the given user with this user token
    // returns a promise with the new session token
    async createRoom(userToken: string) : Promise<string> {
        let playerId = await this.findPlayerIdByUserToken(userToken);
        if(!playerId) {
            console.log("Could not create a new room for sessionToken ");
            return "";
        }

        let sessionToken = await RoomService.createRoom(playerId);
        return sessionToken;
    }

    async findPlayerIdByUserToken(userToken: string) : Promise<Number> { 
        const storedUser = await UserQueries.findByToken(userToken);
        if(!storedUser) {
            console.log("User not found in database");
            return Promise.resolve(0);
        }

        return Promise.resolve(storedUser.id);
    }
}

export default new RoomController();