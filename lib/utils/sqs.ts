import {
  SendMessageCommand,
  DeleteMessageCommand,
  Message,
  SQSClient,
} from "@aws-sdk/client-sqs";

// Retry a message with exponential backoff
export async function retryMessage(
  client: SQSClient,
  queueUrl: string,
  message: Message,
  maxRetryAttempts: number,
  dlqUrl: string | undefined
): Promise<void> {
  const retryCount =
    parseInt(message.MessageAttributes?.RetryCount?.StringValue || "0") || 0;
  const newRetryCount = retryCount + 1;

  if (dlqUrl) {
    if (newRetryCount >= maxRetryAttempts) {
      await moveToDLQ(client, dlqUrl, message);
      await deleteMessage(client, queueUrl, message.ReceiptHandle!);
      return;
    }
  }

  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff
  await new Promise((resolve) => setTimeout(resolve, delay));

  const sendMessageCommand = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: message.Body!,
    MessageAttributes: {
      RetryCount: {
        DataType: "Number",
        StringValue: newRetryCount.toString(),
      },
    },
  });

  try {
    await client.send(sendMessageCommand);
  } catch (error) {
    console.error(`Error retrying message ${message.MessageId}:`, error);
  }
}

// Move a message to the DLQ
export async function moveToDLQ(
  client: SQSClient,
  dlqUrl: string,
  message: Message
): Promise<void> {
  const sendMessageCommand = new SendMessageCommand({
    QueueUrl: dlqUrl,
    MessageBody: message.Body,
  });

  try {
    await client.send(sendMessageCommand);
  } catch (error) {
    console.error("Error moving message to DLQ:", error);
  }
}

// Delete a message from the queue
export async function deleteMessage(
  client: SQSClient,
  queueUrl: string,
  receiptHandle: string
): Promise<void> {
  const command = new DeleteMessageCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error("Error deleting message:", error, receiptHandle);
  }
}
