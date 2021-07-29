import { Controller, Get, Post, Body, Put, Param, Delete, UseInterceptors, UploadedFiles, UploadedFile, Patch, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { CreateUploadDto, RemoveFilePath } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from './config';
import {diskStorage} from 'multer'
import { editFileName, FileFilter } from './utils/file-upload.utils';
import { extname, join } from 'path';
var fs=require('fs');
import { existsSync, mkdirSync } from "fs"
import { Upload } from './upload.interface';
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  
 @Post('multiple') 
 @UseInterceptors(FilesInterceptor('file',null,multerOptions))
async uploadFile(@UploadedFiles() files,@Body() createUploadDto:CreateUploadDto){
 //console.log('file',files)
 await files.forEach(async file => {
  const name = file.filename.split('.')[0];
  var   fileName = name.replace(/[^A-Z0-9]/ig, "-");
    const fileExtName = extname(file.originalname);

    file.filename=fileName+fileExtName
    file.path=file.destination+'/'+fileName+fileExtName
  });
  let res={modelName:createUploadDto.modelName,modelId:createUploadDto.modelId,file:files}
   await this.uploadService.create(res)
  return await res;
}


@Post()
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: 'public/uploads',
      filename: editFileName,
    }),
    fileFilter: FileFilter,
  }),
)
async uploadedFile(@UploadedFile() file,@Body() createUploadDto:CreateUploadDto) {
  console.log('file',file)
  let fileArray=[];
  if(file.path)
  var name = file.filename.split('.')[0];
  var   fileName = name.replace(/[^A-Z0-9]/ig, "-");
    const fileExtName = extname(file.originalname);

    file.filename=fileName+fileExtName
    file.path=file.destination+'/'+fileName+fileExtName
fileArray.push(file)
  let res={modelName:createUploadDto.modelName,modelId:createUploadDto.modelId,file:fileArray}
await this.uploadService.create(res)
  return res;
}

  @Get()
  findAll() {
    return this.uploadService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string):Promise<File[]> {
    const rest=await this.uploadService.findWithSaleOrderId(id);
    if (!rest) {
      console.log('File not found in salesOrder');
      //throw new NotFoundException('File not found in salesOrder!');
      return [];
    }
    // if(rest.length>0){
    //   for(const file of rest){
    //     fs.readFile(file.path,'utf8',function(error,data){
    //       console.log('data',data)
    //       res.sentFile(file,{root:'./uploads'})
    //     })
    //   }
    // }
    return rest.file
  }

  @Get('/filepath/:filename')
  download(@Param('filename') filename:string,@Res() res){
   return res.download('public/uploads/'+filename)
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('file',null,multerOptions))
  async uploadProblem(
      @UploadedFiles() files,
      @Param('id') id: string,
      @Body() updateUploadDto: UpdateUploadDto
  ) {
    console.log('file',files)
      if (files) {
        files.forEach(async file => {
          const name = file.filename.split('.')[0];
  var   fileName = name.replace(/[^A-Z0-9]/ig, "-");
    const fileExtName = extname(file.originalname);

    file.filename=fileName+fileExtName
    file.path=file.destination+'/'+fileName+fileExtName 
        });
        let res={modelName:updateUploadDto.modelName,modelId:updateUploadDto.modelId,file:files}
       var data=await this.uploadService.update(id, res);
      } else {
          throw new BadRequestException('No files uploaded');
      }
      return data
  }
  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateUploadDto: UpdateUploadDto) {
  //   return this.uploadService.update(+id, updateUploadDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadService.remove(id);
  }

  @Post('removeFilePath')
 async removePath(@Body() removeFilePath:RemoveFilePath){
    const fileRemoveWithPath=await this.uploadService.removeFile(removeFilePath)
  if(!fileRemoveWithPath){
    console.log('Have not this file')
  }
  return fileRemoveWithPath
  }
}
