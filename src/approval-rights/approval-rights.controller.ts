import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { ApprovalRight } from './approval-rights.interface';
import { ApprovalRightsService } from './approval-rights.service';
import { CreateApprovalRightDto } from './dto/create-approval-right.dto';
import { UpdateApprovalRightDto } from './dto/update-approval-right.dto';

@ApiTags('approval-rights')
@Controller('approval-rights')
export class ApprovalRightsController {
  constructor(private readonly approvalRightsService: ApprovalRightsService) {}

  @Post('create-new-approval-right')
  createNewApprovalRight(
    @Body() createApprovalRightDto: CreateApprovalRightDto,
  ) {
    return this.approvalRightsService.createNewApprovalRight(
      createApprovalRightDto,
    );
  }

  @Get('get-all-approval-rights')
  async getAllApprovalRights(): Promise<ApprovalRight[]> {
    return await this.approvalRightsService.getAllApprovalRights("purchase");
  }

  @Get('get-all-delivery-approval-rights')
  async getAllDeliveryApprovalRights(): Promise<ApprovalRight[]> {
    return await this.approvalRightsService.getAllApprovalRights("delivery");
  }

  @Get('get-approval-right/:id')
  async getApprovalRightById(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<ApprovalRight> {
    const response = await this.approvalRightsService.getApprovalRightById(id);

    if (!response) {
      throw new NotFoundException(' Approval Rights not found!');
    }
    return response;
  }

  @Patch('update-approval-right/:id')
  async updateApprovalRightById(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateApprovalRightDto: UpdateApprovalRightDto,
  ): Promise<ApprovalRight> {
    const response = await this.approvalRightsService.updateApprovalRightById(
      id,
      updateApprovalRightDto,
    );
    if (!response) {
      throw new NotFoundException('Approval Rights not found!');
    }
    return response;
  }

  @Delete('remove-approval-right/:id')
  async removeApprovalRightById(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<void> {
    return await this.approvalRightsService.removeApprovalRightById(id);
  }
}
