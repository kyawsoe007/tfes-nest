import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { WorkOrderPickingsService } from './work-order-pickings.service';
import { CreateWorkOrderPickingDto } from './dto/create-work-order-picking.dto';
import {
  UpdateWorkOrderPickingDto,
  WoPickingList,
} from './dto/update-work-order-picking.dto';
import { QueryPayload } from './../work-orders/interfaces/work-orders.interface';
import { WorkOrderPicking } from './work-order-pickings.interface';
import { ApiTags } from '@nestjs/swagger';
import { UpdateOneWoPickingDto } from './dto/update-one-pickingOrder.dto';

@ApiTags('work-order-pickings')
@Controller('work-order-pickings')
export class WorkOrderPickingsController {
  constructor(
    private readonly workOrderPickingsService: WorkOrderPickingsService,
  ) {}

  // @Post()
  // async createWorkOrderPicking(
  //   @Body() createWorkOrderPickingDto: CreateWorkOrderPickingDto
  // ) {
  //   return await this.workOrderPickingsService.createWorkOrderPicking(
  //     createWorkOrderPickingDto
  //   );
  // }

  // @Get(':id')
  // async findOneWorkOrderPicking(
  //   queryPayload: QueryPayload,
  // ): Promise<WorkOrderPicking> {
  //   return await this.workOrderPickingsService.findOneWorkOrderPicking(
  //     queryPayload,
  //   );
  // }

  @Delete('remove-all:workOrderId')
  async removeAllWorkOrderPicking(
    @Param('workOrderId') workOrderId: string,
  ): Promise<any> {
    return await this.workOrderPickingsService.deleteMany(workOrderId);
  }

  // @Post()
  // updateWorkOrderPicking(
  //   @Body() updateWorkOrderPickingDto: UpdateWorkOrderPickingDto,
  // ): Promise<WorkOrderPicking[]> {
  //   return this.workOrderPickingsService.updateWorkOrderPicking(
  //     updateWorkOrderPickingDto,
  //   );
  // }

  // @Patch()
  // updateWorkOrderPicking(
  //   @Body() updateWorkOrderPickingDto: UpdateWorkOrderPickingDto,
  // ): Promise<WorkOrderPicking> {
  //   return this.workOrderPickingsService.updateWorkOrderPicking(
  //     updateWorkOrderPickingDto,
  //   );
  // }

  @Get()
  findAllWorkOrderPickings(): Promise<WorkOrderPicking[]> {
    return this.workOrderPickingsService.findAllWorkOrderPickings();
  }

  @Delete(':id')
  removeWorkOrderPicking(@Param('id') id: string) {
    return this.workOrderPickingsService.removeWorkOrderPicking(id);
  }

  @Get('get-wo-picking-by-woId/:workOrderId')
  async findAllWorkOrderPickingByWoId(
    @Param('workOrderId') workOrderId: string,
  ): Promise<WorkOrderPicking[]> {
    return await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
      workOrderId,
    );
  }

  @Get('get-wo-picking-by-woItemId/:woItemId')
  async findAllWorkOrderPickingByWoItemId(
    @Param('woItemId') woItemId: string,
  ): Promise<WorkOrderPicking[]> {
    return await this.workOrderPickingsService.findAllWorkOrderPickingsItemByWoItemId(
      woItemId,
    );
  }

  @Patch('/updateOneWoPickingById/:woPickingId')
  update(
    @Param('woPickingId') woPickingId: string,
    @Body() updateOneWoPickingDto: UpdateOneWoPickingDto,
  ) {
    return this.workOrderPickingsService.updateOneWoPickingById(
      woPickingId,
      updateOneWoPickingDto,
    );
  }
}
