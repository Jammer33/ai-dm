import OpenAIService from '../services/OpenAIService';
import MemoryService from '../services/MemoryService';
import { Character } from '../models/Character';
import DungeonMasterService from '../services/DungeonMasterService';
import { BroadcastOperator } from 'socket.io';
import Message from '../db_models/message';
import MessageQueries from '../queries/MessageQueries';

class DungeonMasterController {

    constructor() {}

    async getDMReplyStreamed(messages: Message[], campaignToken: string, socket: BroadcastOperator<any, any>) { 
        const [listOfRelevantMessages, setOfRecentMessages, sessionState] = await Promise.all([
            DungeonMasterService.getRelevantMessagesForMessages(messages, campaignToken),
            MessageQueries.getNotNewRecentMessages(campaignToken),
            MemoryService.retrieveSessionState(campaignToken),
        ]);

        const setOfRelevantMessages = Array.from(new Set(listOfRelevantMessages.flat()));

        const formattedContext = await DungeonMasterService.formatMessages(setOfRecentMessages, setOfRelevantMessages, messages, sessionState);

        console.log("formatted context: " + JSON.stringify(formattedContext));

        const response = await OpenAIService.getChatStreamed(formattedContext, socket);

        MemoryService.storeMessage(response, campaignToken, "DM");

        DungeonMasterService.updateState(this.formatMemory(messages, response), campaignToken);
        
        return response;
    }

    async initStoryStreamed(character: Character, campaignToken: string, socket: BroadcastOperator<any, any>) {
        const charactersString = "The character involved in this story is: " + character.name + " a " + character.race + " " + character._class;
        const initialPrompt = DungeonMasterService.DungeonMasterPrompt + "\n" + charactersString + ".\n" + "Please begin the story by describing the setting and the current situation.";

        const response = await OpenAIService.getChatStreamed([{ content: initialPrompt, role: "system" }], socket);

        MemoryService.storeMessage(response, campaignToken, "DM");

        const sessionInfo = charactersString + "\n" + response;

        DungeonMasterService.createNewState(sessionInfo, campaignToken);

        return response;
    }

    async getSessionHistory(campaignToken: string) {
        const memories = await MemoryService.retrieveAll(campaignToken);

        return memories;
    }

    async getLastDMInteraction(campaignToken: string) : Promise<string> {
        const memories = await MemoryService.retrieveRecent(campaignToken);
        return memories[memories.length-1].content; 
    }

    formatMemory(userMessages: Message[], dungeonMasterResponse: string, sessionState?: string) {
        return "[User Input]\n" + userMessages.reduce((acc, message) => acc + message.roomToPlayer.characterName + " said: " + message.content + "\n", "") + "\n[DM Response]\n" + dungeonMasterResponse + "\n[Session State]\n" + sessionState;
            
    }

    async requestTTSAudio(message: string, socket: BroadcastOperator<any, any>, playbackSpeed: number) {
        const response = await OpenAIService.getStreamedTTS(message, socket, playbackSpeed);
        return response;
    }
}

export default new DungeonMasterController();
