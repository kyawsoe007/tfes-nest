import { Document } from 'mongoose';
export interface Upload extends Document {
  //readonly file: string;
  id:string;
  file:File[];
  modelName:string;
  modelId:string;
}
export interface File{
  fieldname:string;
   originalname:string;
   encoding:string;
   mimetype:string;
   destination:string;
   filename:string;
   path:string;
   size:string;
}