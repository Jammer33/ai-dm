import OpenAIService, { Message } from '../services/OpenAIService';
import MemoryService from '../services/MemoryService';
import { Character } from '../models/Character';
import DungeonMasterService from '../services/DungeonMasterService';
import { BroadcastOperator } from 'socket.io';

class DungeonMasterController {

    constructor() {}

    async getDMReply(message: string, campaignToken: string) { 
        const formattedContext = await DungeonMasterService.getFormattedContext(campaignToken, message);

        const response = await OpenAIService.getChat(formattedContext);
        
        MemoryService.store(this.formatMemory(message, response), 1, campaignToken);

        DungeonMasterService.updateState(this.formatMemory(message, response), campaignToken);
        
        return response;
    }

    async getDMReplyStreamed(message: string, campaignToken: string, socket: BroadcastOperator<any, any>) { 
        const formattedContext = await DungeonMasterService.getFormattedContext(campaignToken, message);

        const response = await OpenAIService.getChatStreamed(formattedContext, socket);

        MemoryService.store(this.formatMemory(message, response), 1, campaignToken);

        DungeonMasterService.updateState(this.formatMemory(message, response), campaignToken);
        
        return response;
    }

    async initStory(characters: Character[], campaignToken: string) {
        const charactersString = "The characters involved in this story are: " + characters.map((character) => character.name + " a " + character.race + " " + character._class).join(", ")
        const initialPrompt = DungeonMasterService.DungeonMasterPrompt + "\n" + charactersString + ".\n" + "Please begin the story by describing the setting and the current situation. Also explain to the characters how they got to where they are now. The setting should be somewhere within the Forgotten Realms.";

        const response = await OpenAIService.getChat([{ content: initialPrompt, role: "system" }]);

        MemoryService.store(this.formatMemory("", response), 1, campaignToken);

        const sessionInfo = charactersString + "\n" + response;

        DungeonMasterService.createNewState(sessionInfo, campaignToken);

        return response;
    }

    async initStoryStreamed(characters: Character[], campaignToken: string, socket: BroadcastOperator<any, any>) {
        const charactersString = "The characters involved in this story are: " + characters.map((character) => character.name + " a " + character.race + " " + character._class).join(", ")
        const initialPrompt = DungeonMasterService.DungeonMasterPrompt + "\n" + charactersString + ".\n" + "Please begin the story by describing the setting and the current situation.";

        const response = await OpenAIService.getChatStreamed([{ content: initialPrompt, role: "system" }], socket);

        MemoryService.store(this.formatMemory("", response), 1, campaignToken);

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

    formatMemory(userMessage: string, dungeonMasterResponse: string, sessionState?: string) {
        return "[User Input]\n" + userMessage + "\n[DM Response]\n" + dungeonMasterResponse + "\n";
    }

    async requestTTSAudio(message: string, socket: BroadcastOperator<any, any>, playbackSpeed: number) {
        const response = await OpenAIService.getStreamedTTS(message, socket, playbackSpeed);
        return response;
    }


}

export default new DungeonMasterController();
