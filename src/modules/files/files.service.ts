import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import * as FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class FilesService {
  private uploadPath = join(__dirname, '../../../uploads');
  private uuidStr = `${uuidv4()}_`;

  constructor() {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  getFileLink(filename: string): string {
    const host = process.env.HOST || 'https://employer-ai.gravitino.ru';
    return `${host}/uploads/${this.uuidStr}${filename}`;
  }

  async forwardFile(filename: string): Promise<any> {
    const filePath = join(this.uploadPath, filename);

    const form = new FormData();
    form.append('file', createReadStream(filePath), `${this.uuidStr}${filename}`);

    try {
      const response = await axios.post('https://chat-service.gravitino.ru/api/v1.0/gravitino/upload/', form, {
        headers: form.getHeaders(),
      });

      return response.data;
    } catch (err) {
      console.error('Ошибка при пересылке файла:', err.message);
      throw new InternalServerErrorException('Ошибка при пересылке файла на внешний API');
    }
  }
}
