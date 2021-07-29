import * as mongoose from 'mongoose';
const Schema=mongoose.Schema;

export const UploadSchema=new Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    modelName:{type:String},
    modelId:{type:mongoose.Schema.Types.ObjectId,ref:'SalesOrder'},
    file:[{
        fieldname:{type:String},
        originalname:{type:String},
        encoding:{type:String},
        mimetype:{type:String},
        destination:{type:String},
        filename:{type:String},
        path:{type:String},
        size:{type:String},
    }]
},
{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
}
);
UploadSchema.set('toJSON',{virtuals:true});