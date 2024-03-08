import DungeonMasterController from './DungeonMasterController';
import { BroadcastOperator } from 'socket.io';
import UserQueries from '../queries/UserQueries';
import RoomQueries from '../queries/RoomQueries';
import MessageQueries from '../queries/MessageQueries';
import MemoryService from '../services/MemoryService';

class MessageController {
    // memory state mapping that goes from (campaignToken)->(player id, message id)
    private sessionPlayerMessages = new Map<string, Map<string, string>>();
    private tokenCache = new Map<string, string>();
    
    constructor() {
        console.log('MessageController constructor');
    }

    async storeMessageAndActivateDM(campaignToken : string, userToken: string, message: string, socket: BroadcastOperator<any,any>) : Promise<any> {
        await MemoryService.storeMessage(message, campaignToken, userToken);
        let numActivePlayers = await this.getNumberOfPlayers(campaignToken);
        let numPlayersMessaged = await MessageQueries.getNumPlayersMessagedSinceDM(campaignToken);

        if(numPlayersMessaged >= numActivePlayers) {
            let userMessages = await MessageQueries.getPlayerMessagesSinceDM(campaignToken);
            console.log("userMessages: " + JSON.stringify(userMessages));
            const response = await DungeonMasterController.getDMReplyStreamed(userMessages, campaignToken, socket);
            return Promise.resolve(response);
        }
    }

    formatMemoryForDM(campaignToken : string) {
        let formattedMemory = "";
        let playerMessages = this.sessionPlayerMessages.get(campaignToken); 
        if(!playerMessages) {
            console.log("no messages for campaign token: " + campaignToken);
            return "no players for this game";
        }
        
        for(let playerEmail of playerMessages.keys()) {
            formattedMemory += "player with id " + playerEmail + " said: " + playerMessages.get(playerEmail) + ", ";
        }
        return formattedMemory;
    }

    async getNumberOfPlayers(campaignToken : string) {
        return await RoomQueries.findActiveNumberOfPlayersInRoom(campaignToken);
    }

    async findPlayerEmailFromToken(authToken: string) : Promise<string | null> {
        let cachedEmail = this.tokenCache.get(authToken);
        if(cachedEmail) {
            return Promise.resolve(cachedEmail);
        }

        const storedUser = await UserQueries.findByToken(authToken);
        if(!storedUser) {
            return Promise.resolve(null);
        }
        
        this.tokenCache.set(authToken, storedUser.email);
        return Promise.resolve(storedUser.email);
    }

    async getRecentMessages(campaignToken: string) : Promise<Map<String, String>> {
        const playerMessages = this.sessionPlayerMessages.get(campaignToken);
        if(!playerMessages) {
            console.log("no messages from players for campaignToken: " + campaignToken);
            return Promise.resolve(new Map<string, string>());
        }

        return playerMessages;
    }
}

export default new MessageController();