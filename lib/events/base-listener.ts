import {
  SQSClient,
  ReceiveMessageCommand,
  SQSClientConfig,
} from "@aws-sdk/client-sqs";
import { retryMessage, deleteMessage } from "../utils/sqs";

export abstract class Listener<T extends { topic: string }> {
  private client: SQSClient;
  protected queueUrl: string;
  protected dlqUrl?: string;
  protected topic: T["topic"];
  private maxRetryAttempts = 3;

  constructor(
    clientConfig: SQSClientConfig,
    queueUrl: string,
    topic: T["topic"],
    dlqUrl?: string | undefined
  ) {
    this.client = new SQSClient(clientConfig);
    this.queueUrl = queueUrl;
    this.topic = topic;
    if (dlqUrl) this.dlqUrl = dlqUrl;
  }

  async poll() {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
      MessageAttributeNames: ["All"],
    });
    return await this.client.send(command);
  }

  async pollEvents(): Promise<void> {
    const response = await this.poll();
    if (response.Messages) {
      for (const message of response.Messages) {
        try {
          const parsedMessage = JSON.parse(message.Body!);

          // Process the message
          await this.handleEvent(parsedMessage);

          // Delete the message only after successful processing
          await deleteMessage(
            this.client,
            this.queueUrl,
            message.ReceiptHandle!
          );
        } catch (err) {
          // Retry the message if it fails, but only if it has a DLQ queue
          if (this.dlqUrl) {
            await retryMessage(
              this.client,
              this.queueUrl,
              message,
              this.maxRetryAttempts,
              this.dlqUrl
            );
          }
        }
      }
    }
  }

  abstract handleEvent(event: T): Promise<void>;
}
