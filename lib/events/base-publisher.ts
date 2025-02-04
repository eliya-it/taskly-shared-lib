import { retryWithBackoff } from "../utils/utils";
import {
  SNSClient,
  PublishCommand,
  SNSClientConfig,
} from "@aws-sdk/client-sns";
import { Subjects } from "./subjects";
import { ClientConfiguration } from "aws-sdk/clients/acm";
export interface Event<TPayload = unknown> {
  type: (typeof Subjects)[keyof typeof Subjects];
  payload: TPayload;
}

export class Publisher<TPayload = unknown> {
  topicArn: string;
  topic: string;
  client: SNSClient;
  snsOptions: SNSClientConfig;

  constructor(snsOptions: SNSClientConfig, topicArn: string, topic: string) {
    this.snsOptions = snsOptions;
    this.topicArn = topicArn;
    this.topic = topic;
    this.client = new SNSClient(this.snsOptions);
  }

  async publishToSNSTopic(message: any): Promise<void> {
    try {
      const command = new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(message),
      });
      await this.client.send(command);
    } catch (error) {
      console.error("Error publishing message:", error);
    }
  }

  async publish(data: Event<TPayload>): Promise<void> {
    const action = async () => {
      const message = {
        topic: this.topic,
        type: data.type,
        payload: data.payload,
      };
      await this.publishToSNSTopic(message);
    };
    await retryWithBackoff(action);
  }
}
