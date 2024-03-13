import { ChatCompletionMessageParam } from "openai/resources";
import DungeonMasterController from "../controllers/DungeonMasterController";
import MemoryService from "./MemoryService";
import OpenAIService from "./OpenAIService";
import Message from "../db_models/message";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import { DungeonMasterPromptV2 } from "../prompts/GameMasterPrompt";

class DungeonMasterService {
    DungeonMasterPrompt = `You are a skillful dungeon master. You must guide your players through an engaging and fun D&D 5th Edition adventure! Only tell players what they're actual in-game characters know, nothing more. Remember good story teller don't tell their audience things but instead show them through actions and descriptions. However avoid being overly verbose. Also avoid talking directly to the player or suggesting their next moves. This game is played in real-time. Reveal nothing about later events to players. Never roll for your players or make decisions for them. Never end the session unless the campaign has come to a finish. Please ensure to balance combat, puzzles, and role-play. Create an engaging storyline as we go along, always adjusting to what the players do. Please manage experience points and character leveling. Please follow the rules of D&D 5E. For example ask players to roll skill checks when needed. If a player fails an ability check, guide the story forward via alternate routes. Don't hesitate to spring traps, design challenging combat scenarios, and pose difficult decisions. Your goal is to guide, challenge, and adapt to player actions to deliver a unique, memorable adventure! Everything you say will be shown to the players. If you ask for a skill check only ask that they roll the die and tell them which modifier they should add, nothing more. Never tell players what will or might happen before they tell you what they rolled. Also DO NOT GIVE ANY META COMMENTARY, only speak for NPCs and tell players how the evironment acts and reacts their decisions. \n Do not directly address the player, prompt specific actions or decisions from them. It can lead to the player feeling more like they are being told what to do rather than making their own choices in the narrative.`;

    // Prompt get iteratively update the session state with new story information and return the new state
    private firstPrompt = "The following is the current session notes of a 5E Dungeons & Dragons campaign."
    private secondPrompt = "The following is new info on what just happened in the story \n NEW INFO"
    private thirdPrompt = "YOUR ROLE \nIt is your job to update the CAMPAIGN NOTES of the campaign using the dialogue provided. Please include important information about the player characters, quests, locations, items, NPCs etc. Ensure you keep track of what NPCs are present. Also track the current time of day, weather, and current location of the characters.\n\nThere is also a campaign timline that you must keep up to date with any new information. Please add all new events as they happen but as time goes on you can wittle it down to just the important events.\n\nShould a combat be initiated start a combat tracker. Assign all of the enemies and initiative and put them in an attack order list with the players and keep track of who should go next. Please track enemy health. Also track the XP and loot they reward when killed. After combat is complete remove the tracker and add the combat as an event in the timeline. \n\nYou have full creative control over the notes, timeline and battle tracker. Feel free to remove old irrelevant info (though you must ensure all key information is kept), update anything, add new sections, etc.\n\nInclude nothing except the updated session notes, timeline and battle tracker (if combat is ongoing) in your response. The Dungeon Master will rely on what you put here to keep track of the story and gameplay so ensure it is comprehensive and high quality. A new DM should be able to take over and run the campaign soley with what is stored here.\n\nPlease provide the updated campaign notes below. Starting with \"CAMPAIGN NOTES\""

    constructor() {}

    async updateState(newStory: string, campaignToken: string) {
        var oldState = await MemoryService.retrieveSessionState(campaignToken);
        var newState = await OpenAIService.getChat(
            [
                { content: this.firstPrompt, role: "system" },
                { content: oldState, role: "system" },
                { content: this.secondPrompt, role: "system" },
                { content: newStory, role: "system" },
                { content: this.thirdPrompt, role: "system" },
            ]
        );
        await MemoryService.storeSessionState(campaignToken, newState);
        return newState;
    }

    private firstNewStatePrompt = "The following is the beginning of a new Dungeons & Dragons campaign."
    private secondNewStatePrompt = "It is your job to start the CAMPAIGN NOTES of the campaign using the dialogue provided. Please include important information about the player characters, quests, locations, items, NPCs etc. Ensure you keep track of what NPCs are present at all times. Also keep track of the current time of day, weather, and current location of the characters. Also please begin a campaign timeline that will track what has transpired during the campaign. You have full creative control on what is stored here but remember that the Dungeon Master will rely on what you put here to keep track of the story and gameplay so ensure it is comprehensive and high quality. \n Please provide the campaign notes below. Starting with \"CAMPAIGN NOTES\"..."

    async createNewState(newStory: string, campaignToken: string) {
        var newState = await OpenAIService.getChat(
            [
                { content: this.firstNewStatePrompt, role: "system" },
                { content: newStory, role: "system" },
                { content: this.secondNewStatePrompt, role: "system" },
            ]
        );
        await MemoryService.storeSessionState(campaignToken, newState);
        return newState;
    }

    async getRelevantMessagesForMessages(messages: Message[], campaignToken: string) {
        let relevantMessageHistory: Promise<Message[]>[] = [];

        for (let message of messages) {
            relevantMessageHistory.concat(MemoryService.retrieveRelevant(message.content, 3, campaignToken));
        }

        return Promise.all(relevantMessageHistory);
    }


    formatMessages(
        recentMessages: Message[],
        relevantMessages: Message[],
        messages: Message[],
        state: string
        ): ChatCompletionMessageParam[] {
        // const campaignStory: string = "[Campaign Story (this is the story and plan for the campaign) SECRET, PRIVATE FOR DM ONLY]\n" + firstCampaign;
        const sessionState: string = "[Session State (this is the current state of the campaign)]\n" + state;
        const recentMemoryContext: string = "[Conversation History (this is the most recent conversation from the campaign)]\n" + recentMessages.reverse().map((memory) => memory.content).join(" ");
        const relevantMemoryContext: string = "[Story History (these are old tidbits from the campaign that might be relevant to what is going on now. Not recent.)]\n" + relevantMessages.reverse().map((memory) => memory.content).join(" ");
        let promptMessages: ChatCompletionMessageParam[] = [
            { content: DungeonMasterPromptV2, role: "system" },
            // { content: campaignStory, role: "system" },
            { content: sessionState, role: "system" },
            { content: relevantMemoryContext, role: "assistant" },
            { content: recentMemoryContext, role: "assistant" },
        ];

        for (let message of messages) {
            promptMessages.push({ content: message.roomToPlayer.characterName + " said: \n" + message.content, role: "user" });
        }

        return promptMessages;
    }

    formatMessagesAnthropic(
        recentMessages: Message[],
        relevantMessages: Message[],
        messages: Message[],
        state: string
        ): {messages: MessageParam[], systemPrompt: string} {
        // const campaignStory: string = "[Campaign Story (this is the story and plan for the campaign) SECRET, PRIVATE FOR DM ONLY]\n" + firstCampaign;
        const sessionState: string = "[Session State (this is the current state of the campaign)]\n" + state;
        // const systemPrompt = DungeonMasterPromptV2 + "\n\n" + campaignStory + "\n\n" + sessionState;
        const systemPrompt = DungeonMasterPromptV2 + "\n\n" + sessionState;
        const recentMemoryContext: string = "[Conversation History (this is the most recent conversation from the campaign)]\n" + recentMessages.reverse().map((memory) => memory.content).join(" ") + "\n\n";
        const relevantMemoryContext: string = "[Story History (these are old tidbits from the campaign that might be relevant to what is going on now. Not recent.)]\n" + relevantMessages.reverse().map((memory) => memory.content).join(" ") + "\n\n";
        
        let userMessageContent = "[New Messages] \n" + messages.map((message) => message.roomToPlayer.characterName + " said: \n" + message.content);

        let promptMessages: MessageParam[] = [
            { content: relevantMemoryContext + recentMemoryContext + userMessageContent, role: "user" },
        ];

        console

        return {messages: promptMessages, systemPrompt: systemPrompt};
    }
}

export default new DungeonMasterService();