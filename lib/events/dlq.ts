import { SQSClient, SQSClientConfig } from "@aws-sdk/client-sqs";
import { MessageProcessor } from "./MessageProcessor";

export abstract class Dlq {
  protected client: SQSClient;
  protected dlqUrl: string;
  protected queueUrl: string;
  protected maxRetries: number;
  private processor: MessageProcessor;

  constructor(
    options: SQSClientConfig,
    dlqUrl: string,
    queueUrl: string,
    maxRetries = 5 // Default max retries
  ) {
    this.client = new SQSClient(options);
    this.dlqUrl = dlqUrl;
    this.queueUrl = queueUrl;
    this.maxRetries = maxRetries;
    this.processor = new MessageProcessor(
      this.client,
      this.dlqUrl,
      this.queueUrl,
      this.maxRetries
    );
  }

  async processDLQ() {
    try {
      await this.processor.processMessages();
    } catch (error) {
      console.error("Error processing DLQ messages:", error);
    }
  }
}
