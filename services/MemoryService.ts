import fetch from "node-fetch";
import { Index, Pinecone } from "@pinecone-database/pinecone";
import { GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import Memory from "../db_models/memories";
import MemoryQueries from "../queries/MemoryQueries";
import SessionStateQueries from "../queries/SessionStateQueries";
import SessionState from "../db_models/sessionState";
import MessageQueries from "../queries/MessageQueries";


const enum OpenAIModel {
  ADA_EMBEDDING_SMALL = 'text-embedding-3-small',
  ADA_EMBEDDING_LARGE = 'text-embedding-3-large',
}

class MemoryService {
  apiKey: string;
  pinecone: Pinecone;
  s3Client: S3Client;
  bucketName: string;
  embeddingModel: string = OpenAIModel.ADA_EMBEDDING_LARGE;
  pineconeIndex: Index;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });
    this.pineconeIndex = this.pinecone.Index(process.env.PINECONE_INDEX || "");

    this.s3Client = new S3Client({region: "us-east-2"});
    this.bucketName = process.env.S3_BUCKET_NAME || "ai-dm";
    if (process.env.NODE_ENV !== 'dev') {
      this.embeddingModel = OpenAIModel.ADA_EMBEDDING_LARGE;
    }
  }

  async getEmbedding(text: string) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: this.embeddingModel,
      }),
    });

    if (!response.ok) {
      console.error("Error getting embeddings:", response.statusText);
      return;
    }

    const result = await response.json();
    return result.data[0].embedding;
  }

  async storeS3Bucket(content: string, importance: number, timestamp: Date) {
    const key: string = uuidv4();
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Body: JSON.stringify({
        content: content,
        importance: importance,
        timestamp: timestamp
      }),
      Key: key,
    }));
    return key;
  }

  async retrieveS3Bucket(key: string) {
    const response : GetObjectCommandOutput = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })); 
    let body = await response.Body?.transformToString('utf-8') || "";
    return JSON.parse(body);
  }

  async store(text: string, importance: number, campaignToken: string) {
    return this.storeInternal(text, importance, campaignToken);
  }


  private async storeInternal(text: string, importance: number, campaignToken: string) {
    console.log("getting embedding")
    const embedding = await this.getEmbedding(text);
    const timestamp = new Date();

    console.log("storing s3 bucket");
    const id = await this.storeS3Bucket(text, importance, timestamp);

    console.log("getting index");

    console.log("STORING MEMORY: ", id, campaignToken, timestamp);
    await Promise.all([
      Memory.create({
        s3Id: id,
        campaignToken: campaignToken,
        createDate: timestamp,
      }),
      await this.pineconeIndex.namespace(campaignToken).upsert([{ id: id.toString(), values: embedding }])
    ]);
  }

  async storeMessage(text: string, campaignToken: string, userToken: string) {
    const messageId = (await MessageQueries.createMessage(campaignToken, userToken, text)).id;
    const embedding = await this.getEmbedding(text);

    this.pineconeIndex.namespace(campaignToken).upsert([{ id: messageId.toString(), values: embedding }]);
  }

  async retrieveRelevant(query: string, n = 3, campaignToken: string) {
    const queryEmbedding = await this.getEmbedding(query);
    const queryResponse = await this.pineconeIndex.namespace(campaignToken).query({
        vector: queryEmbedding,
        topK: n,
        includeValues: true,
      });

    const ids = queryResponse?.matches?.map((match) => match.id) || [];
    if (ids.length === 0) {
      return [];
    }

    const res = (await MessageQueries.findMessagesByIds(ids)).filter((message) => message.content !== query);
    
    return Promise.resolve(res);
  }

  async retrieveRecent(campaignToken: string) {
    const memories = await MemoryQueries.findRecentMemoriesByCampaignToken(campaignToken);
    
    let res = [];
    for (let i = 0; i < memories.length; i++) {
      const result = await this.retrieveS3Bucket(memories[i].s3Id);
      res.push({
        content: result.content,
        importance: result.importance,
      });
    }
    return res;
  }

  async retrieveAll(campaignToken: string) {
    const memories = await MemoryQueries.findAllMemoriesByCampaignToken(campaignToken);

    let res = [];
    for (let i = 0; i < memories.length; i++) {
      const result = this.retrieveS3Bucket(memories[i].s3Id);
      res.push(result)
    }
    res = await Promise.all(res);

    for (let i = 0; i < res.length; i++) {
      res[i] = {
        content: res[i].content,
        importance: res[i].importance,
      };
    }

    return res;
  }


  async retrieveSessionState(campaignToken: string) {
    const sessionState = await SessionStateQueries.findCampaignStateByCampaignToken(campaignToken);
    if (!sessionState) {
      return "";
    }

    const response = await this.retrieveS3Bucket(sessionState.s3Id);
    return response.content;
  }

  async storeSessionState(campaignToken: string, state: string) {
    const sessionState = await SessionStateQueries.findCampaignStateByCampaignToken(campaignToken);

    // if s3 id exists, update s3 bucket
    if (sessionState) {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Body: JSON.stringify({
          content: state,
        }),
        Key: sessionState.s3Id,
      }));
    } else {
      // else create new s3 bucket
      const id = await this.storeS3Bucket(state, 0, new Date());
      
      SessionState.create({
        s3Id: id,
        campaignToken: campaignToken,
      });
    }
  }
}

export default new MemoryService();
