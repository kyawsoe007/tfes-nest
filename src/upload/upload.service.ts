import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { multerConfig } from './config';
import { CreateUploadDto, RemoveFilePath } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { Upload } from './upload.interface';
const fs = require('fs')
import { existsSync, mkdirSync } from "fs"
import { SalesOrdersService } from 'src/sales-orders/sales-orders.service';
import { ExpensesClaimService } from 'src/expenses-claim/expenses-claim.service';
import { QuotationsService } from 'src/quotations/quotations.service';
const path=require("path")
const {promisify} = require('util');
const {join} = require('path');
const mv = promisify(fs.rename)
@Injectable()
export class UploadService {
  constructor(
    @InjectModel('Upload')
    private readonly uploadModel:Model<Upload>,
    @Inject(forwardRef(()=>SalesOrdersService))
    private readonly salesOrderService:SalesOrdersService,
    private readonly expenseClaimService:ExpensesClaimService,
    @Inject(forwardRef(()=>QuotationsService))
    private readonly quotationsService:QuotationsService
  ){}

  async create(createUploadDto: CreateUploadDto):Promise<Upload> {
    const newFile=await new this.uploadModel(createUploadDto).save();
    if(newFile._id && newFile.modelName=='salesOrder'){
      await this.salesOrderService.updateFileId(newFile.modelId,newFile._id)
    }
    else if(newFile._id && newFile.modelName=='expenseClamin'){
      await this.expenseClaimService.updateFileId(newFile.modelId,newFile._id)
    }
    
    else if(newFile._id && newFile.modelName=='Quotation'){
      await this.quotationsService.updateFileId(newFile.modelId,newFile._id)
    }
    return newFile
  }

  async findAll():Promise<Upload[]> {
    return await this.uploadModel.find();
  }

 async findOne(id: string):Promise<Upload> {
    return await this.uploadModel.findOne({_id:id});
  }
  
  
 async findWithSaleOrderId(modelId:string):Promise<any>{
   const file= await this.uploadModel.findOne({modelId:modelId})

  return file;
  } 

  async update(id: string, updateUploadDto: UpdateUploadDto):Promise<Upload> {
    const findUpload=await this.uploadModel.findOne({modelId:id})
    for(const file of findUpload.file){
      // await fs.unlinkSync(file.path)
      updateUploadDto.file.push(file)
    }
   const res=await this.uploadModel.findByIdAndUpdate(findUpload._id,updateUploadDto,{
     new:true
   })

    return res;
  }

 async remove(id: string) {
   let uploadData=await this.findOne(id)
   for(const file of uploadData.file){
    try {
     await fs.unlinkSync(file.path)
      //file removed
    } catch(err) {
      console.error(err)
    }
   }
    return await this.uploadModel.findByIdAndRemove(id);
  }

  async removeFile(removeFilePath:RemoveFilePath){
    const findUploadFile=await this.uploadModel.findOne({modelId:removeFilePath.modelId})
    for(const file of findUploadFile.file){
      if(removeFilePath.filePath == file.path){
        await fs.unlinkSync(file.path)
      }
    }
    let file = findUploadFile.file.filter( el => el.path !== removeFilePath.filePath );
    const updateFile= await this.uploadModel.findByIdAndUpdate(findUploadFile._id,
      {file:file,
      new:true}
      )
      const findOneUpdateData=await this.findOne(updateFile._id)
return findOneUpdateData.file
    }

}
