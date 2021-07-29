import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LeaveManagementService } from './leave-management.service';
import { CreateLeaveManagementDto } from './dto/create-leave-management.dto';
import { UpdateLeaveManagementDto } from './dto/update-leave-management.dto';
import { ApiTags } from '@nestjs/swagger';
import { FilterDto } from 'src/shared/filter.dto';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { User } from 'src/users/users.interface';

@ApiTags('Leave-Mangement')
@Controller('leave-management')
export class LeaveManagementController {
  constructor(private readonly leaveManagementService: LeaveManagementService) { }

  @Post()
  create(@Body() createLeaveManagementDto: CreateLeaveManagementDto) {
    return this.leaveManagementService.create(createLeaveManagementDto);
  }

  // Find All + Filtered
  @Post('getfilters')
  async getfilters(@Body() query: FilterDto,@AuthUser()user:User) {
    const result = await this.leaveManagementService.getfilters(query,user);
    return result;
  }

  @Get()
  findAll() {
    return this.leaveManagementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveManagementService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeaveManagementDto: UpdateLeaveManagementDto) {
    return this.leaveManagementService.update(id, updateLeaveManagementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveManagementService.remove(id);
  }
}
