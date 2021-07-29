import { ApiProperty } from "@nestjs/swagger";

export class CreateSaleTargetDto {
    @ApiProperty()
    name:string;

    @ApiProperty()
    target:number;
}
