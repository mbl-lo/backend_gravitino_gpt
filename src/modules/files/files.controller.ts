import { Controller, Post, UploadedFile, UseInterceptors, Body, InternalServerErrorException } from '@nestjs/common';
import { ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить файл' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Файл для загрузки',
    type: UploadFileDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Файл успешно загружен. Возвращается ссылка.',
    schema: {
      example: { link: 'http://localhost:3000/uploads/1681883245123-123456789.jpg' },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          callback(null, file.originalname);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: UploadFileDto) {
    if (!file) {
      throw new InternalServerErrorException('Файл не загружен');
    }

    const fileLink = this.filesService.getFileLink(file.originalname);

    const forwardResult = await this.filesService.forwardFile(file.originalname);

    return {
      link: fileLink,
      forwardResult,
    };
  }
}
