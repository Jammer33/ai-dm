import axios from 'axios';
import { Method } from '../models/Methods';
import EventSource from 'eventsource';
import { BroadcastOperator } from 'socket.io';
import { InternalServerError } from '../middleware/ErrorHandler';
import OpenAI from "openai";
import { ChatCompletionMessageParam } from 'openai/resources';


// Endpoints for OpenAI API type
const enum OpenAIEndpoint {
    CHAT = '/chat/completions',
    EMBEDDINGS = '/embeddings',
}

const enum OpenAIModel {
    GPT3 = 'gpt-3.5-turbo-instruct',
    GPT3_16K = 'gpt-3.5-turbo-1106',
    GPT4 = 'gpt-4-0125-preview',
}

export interface Message {
    content: string;
    role: string;
}
// declare data type for OpenAI API
interface OpenAIRequest {
    messages: ChatCompletionMessageParam[];
    model: OpenAIModel;
}

interface Choice {
    message: Message;
    index: number;
    finish_reason: string;
}

interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

interface OpenAIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage: Usage;
}

class OpenAIService {
    openai: OpenAI;
    model: OpenAIModel = OpenAIModel.GPT3_16K;

    constructor() {
        this.openai = new OpenAI();
        if (process.env.NODE_ENV !== 'dev') { 
            console.log("Using GPT4 for completions!");
            this.model = OpenAIModel.GPT4;
        }
    }

    async callApi(data: OpenAIRequest) {

        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: data.messages,
            stream: false,
        })

        try {
            return completion.choices[0].message!!.content as string;
        } catch (error: any) {
            console.log("Error getting response from OpenAI API " + error.data);
            throw new InternalServerError("Error getting response from OpenAI API " + error);
        }
        
        
    }

    async callApiStream(data: OpenAIRequest, socket: BroadcastOperator<any, any>): Promise<string> {
        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: data.messages,
            stream: true,
        });

        return new Promise(async (resolve, reject) => {
            try {
                let finalMessage = "";
                for await (const data of completion) {
                    if (data.choices[0].delta.content == null) {
                        console.log("finalMessage");
                        console.log(finalMessage);
                        socket.emit("DMessage", "[DONE]");
                        resolve(finalMessage);
                        return;
                    }
                    const str = data.choices[0].delta.content;

                    finalMessage += str;

                    socket.emit("DMessage", str);
                };
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }

    async getStreamedTTS(text: string, socket: BroadcastOperator<any, any>, playbackSpeed: number) {
        console.log("Getting TTS for:" + text);
        try {
            // Regular Response from OpenAI API
            const audio = await this.openai.audio.speech.create(
                {
                    model: "tts-1",
                    voice: "alloy",
                    input: text,
                    response_format: "opus",
                    speed: playbackSpeed,
                },
            );

            // print audio class type
            console.log(audio.constructor.name);

            const buffer = Buffer.from(await audio.arrayBuffer());
            
            socket.emit("tts", buffer);

            // Streamed Response from OpenAI API
            // const res = await this.openai.audio.speech.create(
            //     {
            //         model: "tts-1",
            //         voice: "alloy",
            //         input: text,
            //         response_format: "opus",
            //     },
            // );

            // const stream = res.body as unknown as NodeJS.ReadableStream;
            // let chunkToSend: Uint8Array = new Uint8Array();
            // stream.on("data", (chunk) => {
            //     // check chunk type
            //     console.log(chunk.constructor.name);
            //     console.log("chunk");
                
            //     console.log(chunkToSend.byteLength);
            //     chunkToSend = Buffer.concat([chunkToSend, chunk]);
            //     if (chunkToSend.byteLength > 40000) {
            //         socket.emit("tts", chunkToSend);
            //         chunkToSend = Buffer.from("");
            //     }
            // });
        } catch (error) {
            console.log("Error getting TTS from OpenAI API " + error);
            throw new InternalServerError("Error getting TTS from OpenAI API " + error);
        }

        
    }
        


    public async getChat(messages: ChatCompletionMessageParam[]) {
        const endpoint = OpenAIEndpoint.CHAT;
        const method = Method.POST;
        const data = {
            messages: messages,
            model: this.model,
        };
        
        const response = await this.callApi(data);
        return response;
    }

    public async getChatStreamed(messages: ChatCompletionMessageParam[], socket: BroadcastOperator<any, any>) {
        const data = {
            messages: messages,
            model: this.model,
            stream: true,
        };
        
        const response = await this.callApiStream(data, socket);
        return response;
    }

    private messagesFormatter(messages: string[]) {
        return messages.map((message) => {
            return { content: message, role: "user" };
        });
    }
}

export default new OpenAIService();
