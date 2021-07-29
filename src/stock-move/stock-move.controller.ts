import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Header,
  Res,
} from '@nestjs/common';
import { StockMoveService } from './stock-move.service';
import { CreateStockMoveDto, CSVDto } from './dto/create-stock-move.dto';
import { ApiTags } from '@nestjs/swagger';
import { StockMove } from './stock-move.interface';
import { MoveDto } from './dto/save-stock-move.dto';
import { FilterDto } from '../shared/filter.dto';
import { UpdatePackingListDto } from 'src/packing-lists/dto/update-packing-list.dto';
import { CreateStockOperationDto } from 'src/stock-operation/dto/create-stock-operation.dto';
import { UpdateStockMoveDto } from './dto/update-stock-move.dto';
import { Response } from 'express';
import fs = require('fs-extra');
import path = require('path');
const {
  parseAsync,
  Parser,
  transforms: { unwind },
} = require('json2csv');
@ApiTags('stock-move')
@Controller('stock-move')
export class StockMoveController {
  constructor(private readonly stockMoveService: StockMoveService) {}

  @Post()
  async create(
    @Body() createStockLocationDto: CreateStockMoveDto,
  ): Promise<StockMove> {
    return await this.stockMoveService.createNewMove(createStockLocationDto);
  }

  @Header('Content-Type','text/csv')
  @Header('Content-Disposition','attachment; filename=stockMove.csv')
  @Post('exportcsv')
  async findAllToExportCSV(@Res() response:Response,@Body()query:CSVDto){
    
    const stockMove=await this.stockMoveService.findAllToExportCSV(query);
    //console.log('stock',stockMove)
    
    
    const fields=[
      'productId.partNumber',
      'productId.description',
      'skuId.location.name',
      'destinationId.name',
      'operationId.moveNo',
      'operationId.orderNo',
      'operationId.type',
      'completedQty',
      'completedDate'
    ];
    const transforms = [
      unwind({
        paths: ['skuId', 'skuId.skuId'],
        // blankOut: true,
      }),
    ];
    const opts = { fields, transforms };

    if (stockMove.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(stockMove);

      const readFile = fs.readFileSync(
        path.resolve('src/stock-move/templates', 'stockMove.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('Stock Move not Found');
    }
    
  }

  @Get('find-Stock-Move-By-SkuId/:skuId')
  async findStockMoveBySkuId(
    @Param('skuId') skuId: string,
  ): Promise<StockMove[]> {
    const result = await this.stockMoveService.findStockMoveBySkuId(skuId);
    return result;
  }


  @Get(':id')
  async findMoveLines(@Param('id') id: string): Promise<StockMove> {
    const result = await this.stockMoveService.findMoveLines(id);
    return result;
  }

  @Post('save-operation-form')
  async saveMoveLines(@Body() query: MoveDto) {
    const result = await this.stockMoveService.saveMoveLines(query);
    return result;
  }

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.stockMoveService.getfilters(query);
    return result;
  }

  @Patch(':stockMoveId')
  async update(
    @Param('stockMoveId') stockMoveId: string,
    @Body() updateStockMoveDto: UpdateStockMoveDto,
  ): Promise<StockMove> {
    return this.stockMoveService.update(stockMoveId, updateStockMoveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<any> {
    return this.stockMoveService.remove(id);
  }

  @Get('findByLineNumberId/:lineNumberid')
  async findByLineNumberId(
    @Param('lineNumberid') lineNumberid: string,
  ): Promise<StockMove> {
    const result = await this.stockMoveService.findByLineNumberId(lineNumberid);
    return result;
  }
  
  
  
}
