import Room from '../db_models/GameRoom';
import RoomToPlayer from '../db_models/RoomPlayer';
import { RoomState } from "../models/General";
import { generateCampaignToken } from '../utils/UserUtils';

class RoomQueries {
    async createRoom(playerToken: string, name: string, description: string) : Promise<string> {
        let campaignToken = generateCampaignToken()

        while (await this.doesRoomExist(campaignToken)) {
            campaignToken = generateCampaignToken();
        }

        let newRoom = await Room.create({
            name: name,
            description: description,
            ownerToken: playerToken,
            campaignToken: campaignToken,
        });
        console.log(name, description, newRoom.campaignToken);
        this.joinRoom(playerToken, newRoom.campaignToken);
        return Promise.resolve(newRoom.campaignToken);
    }

    async joinRoom(playerToken: string, campaignToken : string) {
        RoomToPlayer.create({
            campaignToken: campaignToken,
            playerToken: playerToken,
            state: RoomState.ACTIVE,
        });
    }

    async leaveRoom(playerToken : string, campaignToken : string) {
        RoomToPlayer.update({
            state: RoomState.INACTIVE,
        },{
            where: {
                campaignToken: campaignToken,
                playerToken: playerToken,
            },
        });
    }

    async findRoomsByPlayer(playerToken: string) : Promise<Room[]> {
        console.log("Finding rooms for player: ", playerToken);
        return Room.findAll({
            include: {
                model: RoomToPlayer,
                required: true,
                where : {
                    playerToken: playerToken,
                },
            },
            where: {
                deleted: false,
            },
        });
    }

    async findActiveNumberOfPlayersInRoom(campaignToken : string) {
        return RoomToPlayer.count({
            where: {
                campaignToken: campaignToken,
                state: RoomState.ACTIVE,
            },
        });
    }

    async findPlayerCampaignToken(playerToken: string) {
        let roomToPlayer = await RoomToPlayer.findOne({
            where: {
                playerToken: playerToken,
            },
        });
        return Promise.resolve(roomToPlayer?.campaignToken.toString() ?? "");
    }

    async deleteRoom(playerToken: string, campaignToken: string) {
        return Room.update({
            deleted: true,
        },{
            where: {
                campaignToken: campaignToken,
                ownerToken: playerToken,
            },
        });
    }

    async doesRoomExist(campaignToken: string) {
        let room = await Room.findOne({
            where: {
                campaignToken: campaignToken,
            },
        });

        return room !== null;
    }

    async isPlayerInRoom(playerToken: string, campaignToken: string) {
        let roomToPlayer = await RoomToPlayer.findOne({
            where: {
                campaignToken: campaignToken,
                playerToken: playerToken,
            },
        });

        return roomToPlayer !== null;
    }

}

export default new RoomQueries();