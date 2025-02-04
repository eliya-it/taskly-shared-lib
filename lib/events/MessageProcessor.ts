import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

export class MessageProcessor {
  private client: SQSClient;
  private dlqUrl: string;
  private queueUrl: string;
  private maxRetries: number;

  constructor(
    client: SQSClient,
    dlqUrl: string,
    queueUrl: string,
    maxRetries: number
  ) {
    this.client = client;
    this.dlqUrl = dlqUrl;
    this.queueUrl = queueUrl;
    this.maxRetries = maxRetries;
  }

  async processMessages(): Promise<void> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.dlqUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 10,
      MessageAttributeNames: ["All"],
    });

    const response = await this.client.send(command);
    if (response.Messages) {
      for (const message of response.Messages) {
        const retryCount = this.getRetryCount(message);

        if (retryCount < this.maxRetries) {
          await this.retryMessage(message.Body!, retryCount + 1);
        } else {
          this.notifyFailure(message.Body!);
        }

        await this.deleteMessage(message.ReceiptHandle!);
      }
    }
  }

  private async retryMessage(messageBody: string, retryCount: number) {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 60000);

    const messageToSend = JSON.stringify({
      message: messageBody,
      retryCount,
      source: "DLQ",
    });

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: messageToSend,
      MessageAttributes: {
        RetryCount: {
          DataType: "Number",
          StringValue: retryCount.toString(),
        },
      },
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.client.send(command);
    } catch (error) {
      console.error("Error retrying message:", error);
    }
  }

  private async deleteMessage(receiptHandle: string) {
    const deleteCommand = new DeleteMessageCommand({
      QueueUrl: this.dlqUrl,
      ReceiptHandle: receiptHandle,
    });

    try {
      await this.client.send(deleteCommand);
    } catch (error) {
      console.error("Error deleting message from DLQ:", error);
    }
  }

  private getRetryCount(message: any): number {
    const retryCountAttr =
      message.MessageAttributes?.RetryCount?.StringValue || "0";
    return parseInt(retryCountAttr, 10);
  }

  private notifyFailure(messageBody: string): void {
    console.error("Permanent failure for message:", messageBody);
  }
}
