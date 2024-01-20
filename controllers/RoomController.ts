import UserQueries from '../queries/UserQueries';
import RoomQueries from '../queries/RoomQueries';

class RoomController {
    // @createRoom creates a new room for the given user with this user token
    // returns a promise with the new session token
    async createRoom(userToken: string) : Promise<string> {
        let playerId = await this.findPlayerIdByUserToken(userToken);
        if(!playerId) {
            console.log("Could not create a new room for sessionToken ");
            return "";
        }

        let sessionToken = await RoomQueries.createRoom(playerId);
        return sessionToken;
    }

    // @joinRoom joins the room for the sessionToken
    async joinRoom(userToken: string, sessionToken: string) : Promise<void> {
        let playerId = await this.findPlayerIdByUserToken(userToken);
        if(!playerId) {
            console.log("Could not create a new room for sessionToken ");
            return;
        }

        RoomQueries.joinRoom(playerId, sessionToken);
    }

    async leaveRoom(userToken: string) {
        let playerId = await this.findPlayerIdByUserToken(userToken);
        if(!playerId) {
            console.log("Could not create a new room for sessionToken ");
            return;
        }

        let sessionToken = await RoomQueries.findPlayerSessionToken(playerId);

        RoomQueries.leaveRoom(playerId, sessionToken ?? "");
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