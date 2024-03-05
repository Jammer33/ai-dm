import DungeonMasterController from './DungeonMasterController';
import { BroadcastOperator } from 'socket.io';
import UserQueries from '../queries/UserQueries';
import RoomQueries from '../queries/RoomQueries';

class MessageController {
    // memory state mapping that goes from (campaignToken)->(player id, message id)
    private sessionPlayerMessages = new Map<string, Map<string, string>>();
    private tokenCache = new Map<string, string>();
    
    constructor() {
        console.log('MessageController constructor');
    }

    // stores the messages in a mmoery representation for the given token
    // and then triggers the DM to respond
    async storeMessageAndActivateDM(campaignToken : string, authToken: string, message: string, socket: BroadcastOperator<any,any>) : Promise<any> {
        let playerId = await this.findPlayerEmailFromToken(authToken);
        if(!playerId) {
            console.log("no player found for campaign token: " + campaignToken);
            return Promise.resolve();
        }
        
        if(!this.sessionPlayerMessages.has(campaignToken)) {
            this.sessionPlayerMessages.set(campaignToken, new Map<string, string>());
        }
        this.sessionPlayerMessages.get(campaignToken)?.set(playerId, message);

        if((this.sessionPlayerMessages.get(campaignToken)?.size ?? 0)
            >= (await this.getNumberOfPlayers(campaignToken))) {
            let formattedUserMessages = this.formatMemoryForDM(campaignToken);
            this.sessionPlayerMessages.delete(campaignToken);
            const response = await DungeonMasterController.getDMReplyStreamed(formattedUserMessages, campaignToken, socket);
            return Promise.resolve(response);
        }
        
        return Promise.resolve();
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