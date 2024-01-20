import DungeonMasterController from './DungeonMasterController';
import { BroadcastOperator } from 'socket.io';
import UserQueries from '../queries/UserQueries';
import RoomQueries from '../queries/RoomQueries';

class MessageController {
    // memory state mapping that goes from (session token)->(player id, message id)
    private sessionPlayerMessages = new Map<string, Map<string, string>>();
    private tokenCache = new Map<string, string>();
    
    constructor() {
        console.log('MessageController constructor');
    }

    // stores the messages in a mmoery representation for the given token
    // and then triggers the DM to respond
    async storeMessageAndActivateDM(sessionToken : string, authToken: string, message: string, socket: BroadcastOperator<any,any>) : Promise<any> {
        let playerId = await this.findPlayerEmailFromToken(authToken);
        if(!playerId) {
            console.log("no player found for session token: " + sessionToken);
            return Promise.resolve();
        }
        
        if(!this.sessionPlayerMessages.has(sessionToken)) {
            this.sessionPlayerMessages.set(sessionToken, new Map<string, string>());
        }
        this.sessionPlayerMessages.get(sessionToken)?.set(playerId, message);

        if((this.sessionPlayerMessages.get(sessionToken)?.size ?? 0)
            >= (await this.getNumberOfPlayers(sessionToken))) {
            let formattedUserMessages = this.formatMemoryForDM(sessionToken);
            this.sessionPlayerMessages.delete(sessionToken);
            const response = await DungeonMasterController.getDMReplyStreamed(formattedUserMessages, sessionToken, socket);
            return Promise.resolve(response);
        }
        
        return Promise.resolve();
    }

    formatMemoryForDM(sessionToken : string) {
        let formattedMemory = "";
        let playerMessages = this.sessionPlayerMessages.get(sessionToken); 
        if(!playerMessages) {
            console.log("no messages for session token: " + sessionToken);
            return "no players for this game";
        }
        
        for(let playerEmail of playerMessages.keys()) {
            formattedMemory += "player with id " + playerEmail + " said: " + playerMessages.get(playerEmail) + ", ";
        }
        return formattedMemory;
    }

    async getNumberOfPlayers(sessionToken : string) {
        return await RoomQueries.findNumberOfPlayersInRoom(sessionToken);
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

    async getRecentMessages(sessionToken: string) : Promise<Map<String, String>> {
        const playerMessages = this.sessionPlayerMessages.get(sessionToken);
        if(!playerMessages) {
            console.log("no messages from players for session token: " + sessionToken);
            return Promise.resolve(new Map<string, string>());
        }

        return playerMessages;
    }
}

export default new MessageController();