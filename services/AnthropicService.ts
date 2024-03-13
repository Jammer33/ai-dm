import Anthropic from "@anthropic-ai/sdk";
import { MessageStreamParams } from "@anthropic-ai/sdk/resources";
import { BroadcastOperator } from "socket.io";

class AnthropicService {
    anthropic: Anthropic;

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || "",
        });
    }

    public async getStreamedResponse(data: MessageStreamParams, socket: BroadcastOperator<any, any>): Promise<string> {
        let finalMessage = "";
        console.log("getStreamedResponse");
        return new Promise(async (resolve, reject) => {
            await this.anthropic.messages.stream(data).on("text", (text) => {
                finalMessage += text;
                console.log(text);
                socket.emit("DMessage", text);
            }).on("end", () => {
                socket.emit("DMessage", "[DONE]");
                resolve(finalMessage);
            });
        });

        
    }

}

export default new AnthropicService();