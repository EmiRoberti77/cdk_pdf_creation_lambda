import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { REGION } from '../../../constants';
import { Readable } from 'stream';

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
      const fileStream = response.Body as Readable;
      const fileBytes = await this.streamToBuffer(fileStream);
      return fileBytes;
    } catch (err: any) {
      console.log(err);
      return null;
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Uint8Array> {
    return new Promise((resolve, rejects) => {
      const chunks: Uint8Array[] = [];

      stream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (err) => {
        console.error(err);
        rejects(err);
      });
    });
  }
}
