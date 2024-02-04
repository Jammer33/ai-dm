import Room from '../db_models/GameRoom';
import RoomToPlayer from '../db_models/RoomPlayer';
import { RoomState } from "../models/General";

class RoomQueries {
    async createRoom(playerId: Number, name: String, description: String) : Promise<string> {
        let newRoom = await Room.create({
            name: name,
            description: description
        });
        let sessionTokenString = newRoom.sessionToken.toString();
        this.joinRoom(playerId, sessionTokenString);
        return Promise.resolve(sessionTokenString);
    }

    async joinRoom(playerId: Number, sessionToken : string) {
        RoomToPlayer.create({
            sessionToken: sessionToken,
            playerId: playerId,
            state: RoomState.ACTIVE,
        });
    }

    async leaveRoom(playerId : Number, sessionToken : string) {
        RoomToPlayer.update({
            state: RoomState.INACTIVE,
        },{
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

    async findActiveNumberOfPlayersInRoom(sessionToken : string) {
        return RoomToPlayer.count({
            where: {
                sessionToken: sessionToken,
                state: RoomState.ACTIVE,
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