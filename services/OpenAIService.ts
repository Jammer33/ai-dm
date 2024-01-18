import axios from 'axios';
import { Method } from '../models/Methods';
import EventSource from 'eventsource';
import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai";
import { Socket } from 'socket.io';
import { InternalServerError } from '../middleware/ErrorHandler';

// Endpoints for OpenAI API type
const enum OpenAIEndpoint {
    CHAT = '/chat/completions',
    EMBEDDINGS = '/embeddings',
}

const enum OpenAIModel {
    GPT3 = 'gpt-3.5-turbo-0613',
    GPT3_16K = 'gpt-3.5-turbo-16k',
    GPT4 = 'gpt-4',
    ADA_EMBEDDING = 'text-embedding-ada-002',
}

export interface Message {
    content: string;
    role: string;
}
// declare data type for OpenAI API
interface OpenAIRequest {
    messages: ChatCompletionRequestMessage[];
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

// 

class OpenAIService {
    openai: OpenAIApi;
    model: OpenAIModel = OpenAIModel.GPT4;

    constructor() {
        const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
        this.openai = new OpenAIApi(configuration);
    }

    async callApi(data: CreateChatCompletionRequest) {

        const completion = await this.openai.createChatCompletion({
            model: OpenAIModel.GPT4,
            messages: data.messages,
            stream: false,
        })

        try {
            return completion.data.choices[0].message!!.content as string;
        } catch (error: any) {
            console.log("Error getting response from OpenAI API " + error.data);
            throw new InternalServerError("Error getting response from OpenAI API " + error);
        }
        
        
    }

    async callApiStream(data: OpenAIRequest, socket: Socket): Promise<any> {
        const completion = await this.openai.createChatCompletion({
            model: OpenAIModel.GPT4,
            messages: data.messages,
            stream: true,
        },
        {
            responseType: 'stream',
        });

        return new Promise((resolve, reject) => {
            try {
                const stream = completion.data as any;
                let finalMessage = "";
                let unfinishedMessage = "";
                stream.on('data', (data: any) => {
                    const lines = data.toString().split('\n').filter((line: any) => line.trim() !== '');
                    for (const line of lines) {
                        const str = line.toString();
                        let jsonStr = str.replace('data: ', '');
                        if (jsonStr === "[DONE]") {
                            console.log("finalMessage");
                            console.log(finalMessage);
                            resolve(finalMessage);
                            return;
                        }
                        jsonStr = unfinishedMessage + jsonStr;

                        let lastChar = jsonStr[jsonStr.length - 1];
                        if(lastChar == '}') {  
                            const json = JSON.parse(jsonStr);
                            const message = json.choices[0].delta.content;
                            if (message !== undefined) {
                                finalMessage += message;
                                socket.emit("message", message);
                            }
                            unfinishedMessage = "";
                        } else {
                            unfinishedMessage = jsonStr;
                        }
                    }
                });
    
                stream.on('error', (error: any) => {
                    reject(error);
                });
    
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }

    public async getChat(messages: ChatCompletionRequestMessage[]) {
        const endpoint = OpenAIEndpoint.CHAT;
        const method = Method.POST;
        const data = {
            messages: messages,
            model: this.model,
        };
        
        const response = await this.callApi(data);
        return response;
    }

    public async getChatStreamed(messages: ChatCompletionRequestMessage[], socket: Socket) {
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
