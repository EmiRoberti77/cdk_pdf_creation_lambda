import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { REGION } from '../../../constants';

export class S3Handler {
  private s3Client: S3Client;
  constructor() {
    this.s3Client = new S3Client({ region: REGION });
  }

  public async put(params: {
    Bucket: string;
    Key: string;
    Body: Uint8Array;
    ContentType: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await this.s3Client.send(new PutObjectCommand(params));
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }

  public async get(params: {
    Bucket: string;
    Key: string;
  }): Promise<Uint8Array | null> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand(params));
      const fileStream = response.Body as ReadableStream;
      const fileBytes = await this.streamToBuffer(fileStream);
      return fileBytes;
    } catch (err: any) {
      console.log(err);
      return null;
    }
  }

  private async streamToBuffer(stream: ReadableStream): Promise<Uint8Array> {
    const reader = stream.getReader();
    const chunks = [];

    let done, value;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      value = result.value;
      if (value) {
        chunks.push(value);
      }
    }

    return Buffer.concat(chunks);
  }
}
