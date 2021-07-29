import { ApiProperty } from "@nestjs/swagger";

// export enum EmployeeStatusEnumDto {
//     OPEN = 'open',
//     DRAFT = 'draft',
//     CANCELLED = 'cancelled',
//     COMPLETED = 'completed',
//     CLOSED = 'closed'
// }

export class CreateEmployeeSettingDto {
    @ApiProperty()
    number: string;

    @ApiProperty()
    idNumber: string;

    @ApiProperty()
    employmentType: string;

    @ApiProperty()
    remarks: string;

    @ApiProperty()
    gender: string;

    @ApiProperty()
    department: string;

    @ApiProperty()
    user: string;

    @ApiProperty()
    workingYears: string;

    @ApiProperty()
    nickName: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    address: string;

    @ApiProperty()
    phoneNum: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    emergencyPerson: string;

    @ApiProperty()
    emergencyTel: string;

    @ApiProperty()
    hireDate: Date;

    @ApiProperty()
    issueDate: Date;

    @ApiProperty()
    position: string;

    @ApiProperty()
    passPortNo: string;

    @ApiProperty()
    passType: string;

    @ApiProperty()
    scpr: string;

    @ApiProperty()
    annualLeave: number;

    @ApiProperty()
    remainingAnnualLeave: number;

    @ApiProperty()
    sickLeave: number;

    @ApiProperty()
    remainingSickLeave: number;

    @ApiProperty()
    childcareLeave: number;

    @ApiProperty()
    remainingChildCareLeave: number;

    @ApiProperty()
    inLieuLeave: number;

    @ApiProperty()
    remainingInLieuLeave: number;

    // @ApiProperty()
    // maternityLeave: number;

    // @ApiProperty()
    // remainingMaternityLeave: number;

    // @ApiProperty()
    // paternityLeave: number;

    // @ApiProperty()
    // remainingPaternityLeave: number;

    // @ApiProperty()
    // sharedPaternityLeave: number;

    // @ApiProperty()
    // remainingSharedPaternityLeave: number;

    @ApiProperty()
    leaveCarriedForward: number;

    // @ApiProperty()
    // remainingUnpaidLeave: number;

    @ApiProperty()
    reservistLeave: number;

    @ApiProperty()
    remainingReservistLeave: number;

    @ApiProperty()
    cpfFEmployer: string;

    @ApiProperty()
    cpfFEmployee: string;

    @ApiProperty()
    levy: string;

    @ApiProperty()
    sdl: string;

    @ApiProperty()
    allowance: string;

    @ApiProperty()
    basicSalary: string;

    // @ApiProperty({
    //     enum: ['draft', 'open', 'cancelled', 'completed', 'closed']
    // })
    // status: EmployeeStatusEnumDto;

}
