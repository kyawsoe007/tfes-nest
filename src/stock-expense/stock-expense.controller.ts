import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { StockExpenseService } from './stock-expense.service';
import { CreateStockExpenseDto } from './dto/create-stock-expense.dto';
import { UpdateStockExpenseDto } from './dto/update-stock-expense.dto';
import { ApiTags } from '@nestjs/swagger';
import { StockExpense } from './stock-expense.interface';

@ApiTags('StockExpense')
@Controller('stock-expense')
export class StockExpenseController {
  constructor(private readonly stockExpenseService: StockExpenseService) {}

  @Post()
  async create(@Body() createStockExpenseDto: CreateStockExpenseDto) {
    return await this.stockExpenseService.create(createStockExpenseDto);
  }

  @Get()
  async findAll():Promise<StockExpense[]> {
    return await this.stockExpenseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string):Promise<StockExpense> {
    return await this.stockExpenseService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateStockExpenseDto: UpdateStockExpenseDto,
    ):Promise<StockExpense> {
    const result= await this.stockExpenseService.update(id, updateStockExpenseDto);
    if(!result){
      throw new NotFoundException('Stock-Expense does not exit!')
    }  
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.stockExpenseService.remove(id);
  }
}
