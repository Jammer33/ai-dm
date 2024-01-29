import Room from '../db_models/GameRoom';
import RoomToPlayer from '../db_models/RoomPlayer';

class RoomQueries {
    async createRoom(playerId: Number, name: String, description: String) : Promise<string> {
        let newRoom = await Room.create({
            name: name,
            description: description
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

    async findRoomsByPlayer(playerId: Number) : Promise<Room[]> {
        return Room.findAll({
            include: {
                model: RoomToPlayer,
                required: true,
                where : {
                    playerId: playerId,
                },
            }
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