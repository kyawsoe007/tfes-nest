import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

class StockExpenseItemsDto{
    @ApiProperty()
    SN:number;

    @ApiProperty()
    description:string;

    @ApiProperty()
    qty:number;

    @ApiProperty()
    reason:string;

    @ApiProperty()
    skuId:string;

    @ApiProperty()
    productId:string;
}

export class CreateStockExpenseDto {
    @ApiProperty()
    tfesPic:string;

    @ApiProperty()
    status:string;

    @ApiProperty()
    date:Date;

    @ApiProperty()
    remarks:string;

    @ValidateNested({each:true})
    @Type(()=>StockExpenseItemsDto)
    stockExpenseItem:StockExpenseItemsDto[];
    _id:string;
}
