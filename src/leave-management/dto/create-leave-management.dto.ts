import { ApiProperty } from "@nestjs/swagger";

export enum LeaveStatusEnumDto {
    WaitingApproval = 'waiting_approval',
    DRAFT = 'draft',
    CANCELLED = 'cancelled',
    Approved = 'approved',
}

export class CreateLeaveManagementDto {
    @ApiProperty()
    number: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    reasons: string;

    @ApiProperty()
    offDays: string;

    @ApiProperty()
    employeeName: string;

    @ApiProperty()
    applyDate: Date;

    @ApiProperty()
    startDate: Date;

    @ApiProperty()
    endDate: Date;

    @ApiProperty()
    transferDate: Date;

    @ApiProperty({
        enum: ['draft', 'waiting_approval', 'cancelled', 'approved']
    })
    status: LeaveStatusEnumDto;
}
