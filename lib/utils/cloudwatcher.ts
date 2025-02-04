import { CloudWatchLogs } from "aws-sdk";
import { ClientConfiguration } from "aws-sdk/clients/acm";

const logGroupName = "/taskly/notifications";
const logStreamName = "notifications-listener";

class CloudWatcher {
  private cloudwatchlogs: CloudWatchLogs;
  private sequenceToken: string | undefined;

  constructor(cloudWatchOptions: ClientConfiguration) {
    this.cloudwatchlogs = new CloudWatchLogs(cloudWatchOptions);
    this.sequenceToken = undefined;
  }

  async createLogStream() {
    try {
      await this.cloudwatchlogs.createLogGroup({ logGroupName }).promise();
    } catch (err: any) {
      if (err.code !== "ResourceAlreadyExistsException") {
        console.error("Error creating log group:", err);
      }
    }

    try {
      await this.cloudwatchlogs
        .createLogStream({
          logGroupName,
          logStreamName,
        })
        .promise();
    } catch (err: any) {
      if (err.code !== "ResourceAlreadyExistsException") {
        console.error("Error creating log stream:", err);
      }
    }
  }

  async logToCloudWatch(message: any): Promise<void> {
    const timestamp = new Date().getTime();

    const params = {
      logGroupName,
      logStreamName,
      logEvents: [
        {
          timestamp,
          message,
        },
      ],
      ...(this.sequenceToken && { sequenceToken: this.sequenceToken }),
    };

    try {
      const response = await this.cloudwatchlogs.putLogEvents(params).promise();
      this.sequenceToken = response.nextSequenceToken;
    } catch (err: any) {
      if (
        err.code === "InvalidSequenceTokenException" &&
        err.expectedSequenceToken
      ) {
        this.sequenceToken = err.expectedSequenceToken; // Update the sequence token
        await this.logToCloudWatch(message); // Retry the log
      } else {
        console.error("Error sending logs to CloudWatch:", err.message);
      }
    }
  }
}

export default CloudWatcher;
