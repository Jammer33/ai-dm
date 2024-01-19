import Room from '../db_models/GameRoom';


// TO BE IMPLEMENTED
class RoomService {
    // create a room with the given player id
    // returns the session token for the room
    async createRoom(playerId: Number) : Promise<string> {
        let newRoom = await Room.create({
            playerId: playerId
        });
        return Promise.resolve(newRoom.sessionToken.toString());
    }

    async joinRoom(sessionToken : string) {

    }

    async leaveRoom(sessionToken : string) {

    }

    findNumberOfPlayersInRoom(sessionToken : string) {
        // will be used to determine if the DM should be triggered
        // will be found from the our information stored in the database on session initiation
        return 1;
    }
}

export default new RoomService();