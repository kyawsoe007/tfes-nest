import { ApiProperty } from '@nestjs/swagger';
export class DateDto{
    @ApiProperty({ required: false })
    startDate:Date;
    @ApiProperty({ required: false })
    endDate:Date;
}
export class DateAndAccount{
    @ApiProperty({ required: false })
    startDate:Date;
    @ApiProperty({ required: false })
    endDate:Date;
    @ApiProperty()
    account:string;
}