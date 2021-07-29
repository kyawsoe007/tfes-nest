import { HttpException, HttpStatus } from "@nestjs/common"
import { existsSync, mkdirSync } from "fs"
import { extname } from "path"
import {v4 as uuid} from 'uuid'
import {diskStorage} from 'multer'

export const multerConfig={
    dest:'public/uploads'
}

function uuidRandom(file){
    const result=`${uuid()}${extname(file.originalname)}`;
    return result;
}

export const multerOptions={
    fileFilter:(req:any,file:any,cb:any)=>{
        console.log('file',file)
        if(file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|csv)$/)){
            cb(null,true)
        } else {
            cb(new HttpException(`Unsuppported file type ${extname(file.originalname)}`,HttpStatus.BAD_REQUEST),false);
        }
    },
    storage:diskStorage({
        destination:(req:any,file:any,cb:any)=>{
            const uploadPath=multerConfig.dest
            if(!existsSync(uploadPath)){
                mkdirSync(uploadPath);
            }
            cb(null,uploadPath)
        },
        filename:(req:any,file:any,cb:any)=>{
           
            const name = file.originalname.split('.')[0];
            var   fileName = name.replace(/[^A-Z0-9]/ig, "-");
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  cb(null, `${fileName}-${randomName}${fileExtName}`);
        }
    })
}