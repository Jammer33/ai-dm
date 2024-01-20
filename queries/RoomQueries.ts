import Room from '../db_models/GameRoom';
import RoomToPlayer from '../db_models/RoomPlayer';

class RoomQueries {
    // create a room with the given player id
    // returns the session token for the room
    async createRoom(playerId: Number) : Promise<string> {
        let newRoom = await Room.create({
        });
        RoomToPlayer.create({
            sessionToken: newRoom.sessionToken,
            playerId: playerId
        });
        return Promise.resolve(newRoom.sessionToken.toString());
    }

    async joinRoom(playerId: Number, sessionToken : string) {
        RoomToPlayer.create({
            sessionToken: sessionToken,
            playerId: playerId
        });
    }

    async leaveRoom(playerId : Number, sessionToken : string) {
        RoomToPlayer.destroy({
            where: {
                sessionToken: sessionToken,
                playerId: playerId,
            },
        });
    }

    async findNumberOfPlayersInRoom(sessionToken : string) {
        return RoomToPlayer.count({
            where: {
                sessionToken: sessionToken,
            },
        });
    }

    async findPlayerSessionToken(playerId: Number) {
        let roomToPlayer = await RoomToPlayer.findOne({
            where: {
                playerId: playerId,
            },
        });
        return Promise.resolve(roomToPlayer?.sessionToken.toString() ?? "");
    }
}

export default new RoomQueries();