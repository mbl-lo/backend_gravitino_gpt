import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'Опциональное описание файла' })
  description?: string;
}
