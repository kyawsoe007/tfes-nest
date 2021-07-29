import { ApiProperty } from '@nestjs/swagger';

export class CreateUploadDto {
@ApiProperty()
file:FileDto[]
@ApiProperty()
modelName:string
@ApiProperty()
modelId:string;
}
export class FileDto{
       @ApiProperty()
       fieldname:string;
        @ApiProperty()
        originalname:string;
        @ApiProperty()
        encoding:string;
        @ApiProperty()
        mimetype:string;
        @ApiProperty()
        destination:string;
        @ApiProperty()
        filename:string;
        @ApiProperty()
        path:string;
        @ApiProperty()
        size:string;
}

export class RemoveFilePath{
        @ApiProperty()
        modelId:string;

        @ApiProperty()
        filePath:string;
}
