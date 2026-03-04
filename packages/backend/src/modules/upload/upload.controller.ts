import { Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('parse')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    parse(@UploadedFile() file: Express.Multer.File) {
        return this.uploadService.parseAndStore(file);
    }
}
