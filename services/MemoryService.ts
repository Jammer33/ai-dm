import fetch from "node-fetch";
import { PineconeClient } from "@pinecone-database/pinecone";
import { GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import Memory from "../db_models/memories";
import MemoryQueries from "../queries/MemoryQueries";
import SessionStateQueries from "../queries/SessionStateQueries";
import SessionState from "../db_models/sessionState";


class MemoryService {
  apiKey: string;
  pinecone: PineconeClient;
  index: string;
  s3Client: S3Client;
  bucketName: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.pinecone = new PineconeClient();
    this.pinecone.init({
      environment: "northamerica-northeast1-gcp",
      apiKey: process.env.PINECONE_API_KEY || "",
    });
    this.index = process.env.PINECONE_INDEX || "";

    this.s3Client = new S3Client({region: "us-east-2"});
    this.bucketName = process.env.S3_BUCKET_NAME || "ai-dm";
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
        model: "text-embedding-ada-002",
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

  async store(text: string, importance: number, sessionToken: string) {
    return this.storeInternal(text, importance, sessionToken);
  }


  private async storeInternal(text: string, importance: number, sessionToken: string) {
    const embedding = await this.getEmbedding(text);
    const timestamp = new Date();

    const id = await this.storeS3Bucket(text, importance, timestamp);

    const index = this.pinecone.Index(this.index);

    await Promise.all([
      Memory.create({
        s3Id: id,
        sessionToken: sessionToken,
      }),
      await index.upsert({
        upsertRequest: {
          vectors: [{ id: id.toString(), values: embedding }],
          namespace: sessionToken,
        },
      })
    ]);
  }

  async retrieveRelevant(query: string, n = 3, sessionToken: string) {
    const queryEmbedding = await this.getEmbedding(query);
    console.log("query embedding:", queryEmbedding);
    const index = this.pinecone.Index(this.index);
    console.log("index:", index);
    const queryResponse = await index.query({
      queryRequest: {
        vector: queryEmbedding,
        topK: n,
        includeValues: true,
        namespace: sessionToken,
      },
    });
    console.log("query response:", queryResponse);

    const ids = queryResponse?.matches?.map((match) => match.id) || [];
    if (ids.length === 0) {
      return [];
    }

    let res = [];
    for (let i = 0; i < ids.length; i++) {
      const result = await this.retrieveS3Bucket(ids[i]);
      res.push({
        content: result.content,
        importance: result.importance,
      });
    }
    
    return res;
  }

  async retrieveRecent(sessionToken: string) {
    const memories = await MemoryQueries.findRecentMemoriesBySessionToken(sessionToken);
    
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

  async retrieveAll(sessionToken: string) {
    const memories = await MemoryQueries.findAllMemoriesBySessionToken(sessionToken);

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


  async retrieveSessionState(sessionToken: string) {
    const sessionState = await SessionStateQueries.findSessionStateBySessionToken(sessionToken);
    if (!sessionState) {
      return "";
    }

    const response = await this.retrieveS3Bucket(sessionState.s3Id);
    return response.content;
  }

  async storeSessionState(sessionToken: string, state: string) {
    const sessionState = await SessionStateQueries.findSessionStateBySessionToken(sessionToken);

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
        sessionToken: sessionToken,
      });
    }
  }
}

export default new MemoryService();
