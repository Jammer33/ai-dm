import Room from '../db_models/GameRoom';
import RoomToPlayer from '../db_models/RoomPlayer';
import { Character } from '../models/Character';
import { RoomState } from "../models/General";
import { generateCampaignToken } from '../utils/UserUtils';

class RoomQueries {
    async createRoom(userToken: string, name: string, description: string, character: Character) : Promise<string> {
        let campaignToken = generateCampaignToken()

        while (await this.doesRoomExist(campaignToken)) {
            campaignToken = generateCampaignToken();
        }

        let newRoom = await Room.create({
            name: name,
            description: description,
            ownerToken: userToken,
            campaignToken: campaignToken,
        });
        console.log(name, description, newRoom.campaignToken);
        this.joinRoom(userToken, newRoom.campaignToken, character);
        return Promise.resolve(newRoom.campaignToken);
    }

    async joinRoom(userToken: string, campaignToken : string, character: Character) {
        RoomToPlayer.create({
            campaignToken: campaignToken,
            userToken: userToken,
            state: RoomState.ACTIVE,
            characterName: character.name,
        });
    }

    async leaveRoom(userToken : string, campaignToken : string) {
        RoomToPlayer.update({
            state: RoomState.INACTIVE,
        },{
            where: {
                campaignToken: campaignToken,
                userToken: userToken,
            },
        });
    }

    async findRoomsByPlayer(userToken: string) : Promise<Room[]> {
        console.log("Finding rooms for player: ", userToken);
        return Room.findAll({
            include: {
                model: RoomToPlayer,
                required: true,
                where : {
                    userToken: userToken,
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

    async findPlayerCampaignToken(userToken: string) {
        let roomToPlayer = await RoomToPlayer.findOne({
            where: {
                userToken: userToken,
            },
        });
        return Promise.resolve(roomToPlayer?.campaignToken.toString() ?? "");
    }

    async deleteRoom(userToken: string, campaignToken: string) {
        return Room.update({
            deleted: true,
        },{
            where: {
                campaignToken: campaignToken,
                ownerToken: userToken,
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

    async isPlayerInRoom(userToken: string, campaignToken: string) {
        let roomToPlayer = await RoomToPlayer.findOne({
            where: {
                campaignToken: campaignToken,
                userToken: userToken,
            },
        });

        return roomToPlayer !== null;
    }

    async getCharacterName(userToken: string, campaignToken: string) {
        let roomToPlayer = await RoomToPlayer.findOne({
            where: {
                campaignToken: campaignToken,
                userToken: userToken,
            },
        });

        return roomToPlayer?.characterName ?? "";
    }

    async getUserTokenToCharacterNameMap(campaignToken: string) {
        let roomToPlayers = await RoomToPlayer.findAll({
            where: {
                campaignToken: campaignToken,
            },
        });

        console.log("roomToPlayers: " + JSON.stringify(roomToPlayers));

        let tokenToCharacterNameMap = new Map<string, string>();
        for(let roomToPlayer of roomToPlayers) {
            console.log("roomToPlayer: " + JSON.stringify(roomToPlayer));
            tokenToCharacterNameMap.set(roomToPlayer.userToken, roomToPlayer.characterName);
        }

        console.log("tokenToCharacterNameMap: " + tokenToCharacterNameMap);

        return tokenToCharacterNameMap;
    }

}

export default new RoomQueries();