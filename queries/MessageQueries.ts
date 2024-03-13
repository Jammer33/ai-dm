import { Op } from "sequelize";
import Message from "../db_models/message";
import RoomToPlayer from "../db_models/RoomPlayer";

class MessageQueries {
    constructor() {}

    async getNumPlayersMessagedSinceDM(campaignToken: string): Promise<number> {
        const DMMessages = await Message.findAll({
            where: {
                campaignToken: campaignToken,
                userToken: "DM",
            },
        });
        const lastDmMessage = DMMessages[DMMessages.length - 1];

        return Message.count({
            distinct: true,
            col: 'userToken',
            where: {
            campaignToken: campaignToken,
            createdAt: {
                [Op.gt]: lastDmMessage?.createdAt,
            },
            },
        });
    }

    async getPlayerMessagesSinceDM(campaignToken: string): Promise<Message[]> {
        const lastDmMessage = await Message.findOne({
            where: {
                campaignToken: campaignToken,
                userToken: "DM",
            },
        });
        console.log("lastDmMessage: " + JSON.stringify(lastDmMessage));

        return Message.findAll({
            where: {
                campaignToken: campaignToken,
                createdAt: {
                    [Op.gt]: lastDmMessage?.createdAt,
                },
            },
            include: [{ 
                model: RoomToPlayer, 
                attributes: ['characterName', 'userToken', 'campaignToken'], 
                where: {
                    '$Message.user_token$': { [Op.col]: 'roomToPlayer.user_token' },
                }
            }],
        });
    }

    async getNotNewRecentMessages(campaignToken: string): Promise<Message[]> {
        const lastDmMessage = await Message.findOne({
            where: {
                campaignToken: campaignToken,
                userToken: "DM",
            },
            order: [['createdAt', 'DESC']],
        });
        
        return Message.findAll({
            where: {
                campaignToken: campaignToken,
                createdAt: {
                    [Op.lte]: lastDmMessage?.createdAt,
                },
            },
            include: [{ 
                model: RoomToPlayer, 
                attributes: ['characterName', 'userToken', 'campaignToken'], 
                where: {
                    '$Message.user_token$': { [Op.col]: 'roomToPlayer.user_token' },
                }
            }],
            order: [['createdAt', 'ASC']],
            limit: 20,
        });
    }

    async createMessage(campaignToken: string, userToken: string, content: string) {
        return Message.create({
            campaignToken: campaignToken,
            userToken: userToken,
            content: content,
        });
    }

    async findMessagesByIds(ids: string[]) {
        return Message.findAll({
            where: {
                id: {
                    [Op.in]: ids,
                },
            },
        });
    }

    // get messages for a campaign token paginated and sorted by created at
    async getMessagesForCampaign(campaignToken: string, limit: number, offset: number) {
        return Message.findAll({
            where: {
                campaignToken: campaignToken,
            },
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            attributes: ['content', 'createdAt', 'userToken'],
        });
    }
}

export default new MessageQueries();