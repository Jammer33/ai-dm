import DungeonMasterController from './DungeonMasterController';
import MemoryService from '../services/MemoryService';
import RoomService from '../services/RoomService';
import { Socket } from 'socket.io';
import UserQueries from '../queries/UserQueries';
import User from '../db_models/user';

class MeessageController {
    // memory state mapping that goes from (session token)->(player id, message id)
    private sessionPlayerMessages = new Map<string, Map<string, string>>();
    private tokenCache = new Map<string, string>();
    
    constructor() {
        console.log('MessageController constructor');
    }

    // stores the messages in a mmoery representation for the given token
    // and then triggers the DM to respond
    async storeMessageAndActivateDM(sessionToken : string, authToken: string, message: string, socket: Socket) : Promise<any> {
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
            >= this.getNumberOfPlayers(sessionToken)) {
            let formattedUserMessages = this.formatMemoryForDM(sessionToken);
            console.log("formattedUserMessages " + formattedUserMessages);
            // const response = await DungeonMasterController.getDMReplyStreamed(formattedUserMessages, sessionToken, socket);
            return Promise.resolve();
        }
        
        return Promise.resolve();
    }

    formatMemoryForDM(sessionToken : string) {
        let formattedMemory = "";
        let playerMessages = this.sessionPlayerMessages.get(sessionToken);
        console.log("playerMessages: " + playerMessages?.size); 
        if(!playerMessages) {
            console.log("no messages for session token: " + sessionToken);
            return "no players for this game";
        }
        
        for(let playerEmail of playerMessages.keys()) {
            console.log("playerEmail: " + playerEmail);
            formattedMemory += "player with id " + playerEmail + " said: " + playerMessages.get(playerEmail) + ", ";
        }
        return formattedMemory;
    }

    getNumberOfPlayers(sessionToken : string) {
        return RoomService.findNumberOfPlayersInRoom(sessionToken);
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
}

export default new MeessageController();