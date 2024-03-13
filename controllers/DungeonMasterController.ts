import OpenAIService from '../services/OpenAIService';
import MemoryService from '../services/MemoryService';
import { Character } from '../models/Character';
import DungeonMasterService from '../services/DungeonMasterService';
import { BroadcastOperator } from 'socket.io';
import Message from '../db_models/message';
import MessageQueries from '../queries/MessageQueries';
import AnthropicService from '../services/AnthropicService';
import { DungeonMasterPromptV2 } from '../prompts/GameMasterPrompt';

class DungeonMasterController {

    constructor() {}

    async getDMReplyStreamed(messages: Message[], campaignToken: string, socket: BroadcastOperator<any, any>) { 
        const listOfRelevantMessagesPromise = DungeonMasterService.getRelevantMessagesForMessages(messages, campaignToken); 
        const setOfRecentMessagesPromise = MessageQueries.getNotNewRecentMessages(campaignToken);
        const sessionStatePromise = MemoryService.retrieveSessionState(campaignToken);
        
        let listOfRelevantMessages : Message[][] = [];
        try {
            listOfRelevantMessages = await listOfRelevantMessagesPromise;
        } catch (e) {
            console.log("Error getting relevant messages: " + e);
        }

        let setOfRecentMessages : Message[] = [];
        try {
            setOfRecentMessages = await setOfRecentMessagesPromise;
        } catch (e) {
            console.log("Error getting recent messages: " + e);
        }

        let sessionState : string = "";
        try {
            sessionState = await sessionStatePromise;
        } catch (e) {
            console.log("Error getting session state: " + e);
        }

        const setOfRelevantMessages = Array.from(new Set(listOfRelevantMessages.flat()));

        let response: string;
        if (process.env.USE_ANTHROPIC === "true") {
            const formattedContext = await DungeonMasterService.formatMessagesAnthropic(setOfRecentMessages, setOfRelevantMessages, messages, sessionState);
            response = await AnthropicService.getStreamedResponse({
                messages: formattedContext.messages,
                system: formattedContext.systemPrompt,
                model: "claude-3-opus-20240229",
                max_tokens: 1000,
            }, socket);
        } else {
            const formattedContext = await DungeonMasterService.formatMessages(setOfRecentMessages, setOfRelevantMessages, messages, sessionState);
            response = await OpenAIService.getChatStreamed(formattedContext, socket);
        }

        MemoryService.storeMessage(response, campaignToken, "DM");

        DungeonMasterService.updateState(this.formatMemory(messages, response), campaignToken);
        
        return response;
    }

    async initStoryStreamed(character: Character, campaignToken: string, socket: BroadcastOperator<any, any>) {
        const charactersString = "The character involved in this story is: " + character.name + " a " + character.race + " " + character._class;
        // const storyString = "The campaign plan is as follow: " + firstCampaign + "\n";
        // const initialPrompt = DungeonMasterPromptV2 + "\n" + charactersString + ".\n" + storyString + "Please begin the story by describing the setting and the current situation.";
        const initialPrompt = DungeonMasterPromptV2 + "\n" + charactersString + ".\n" + "Please begin the story by describing the setting and the current situation.";
        let response: string;

        if (process.env.USE_ANTHROPIC === "true") {
            response = await AnthropicService.getStreamedResponse({
                messages: [{ content: "begin.", role: "user" }],
                system: initialPrompt,
                model: "claude-3-opus-20240229",
                max_tokens: 512,
            }, socket);
            console.log("response: " + response);
        } else {
            response = await OpenAIService.getChatStreamed([{ content: initialPrompt, role: "system" }], socket);
        }

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
