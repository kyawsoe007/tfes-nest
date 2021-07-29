import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from 'src/products/products.service';
import { SkusService } from 'src/skus/skus.service';
import { UsersService } from 'src/users/users.service';
import { StockOperationService } from 'src/stock-operation/stock-operation.service';
import { StockLocationService } from 'src/stock-location/stock-location.service';
import { CreateStockExpenseDto } from './dto/create-stock-expense.dto';
import { UpdateStockExpenseDto } from './dto/update-stock-expense.dto';
import { StockExpense } from './stock-expense.interface';
import { CreateStockOperationDto } from 'src/stock-operation/dto/create-stock-operation.dto';
import { CreateStockMoveDto } from 'src/stock-move/dto/create-stock-move.dto';
import { StockMove } from 'src/stock-move/stock-move.interface';

@Injectable()
export class StockExpenseService {
  //added constructor
  constructor(
    @InjectModel('StockExpense')
    private readonly stockExpenseModel:Model<StockExpense>,
    private readonly usersService:UsersService,
    private readonly stockOperationService:StockOperationService,
    private readonly stockLoctionService:StockLocationService,
    private readonly skusService:SkusService,
    private readonly productsService:ProductsService
  ){}
  async create(createStockExpenseDto: CreateStockExpenseDto) {
    let newData=await this.stockExpenseModel.create(createStockExpenseDto)
    
    return newData.save();
  }

  async findAll():Promise<StockExpense[]> {
   let res=await this.stockExpenseModel.find().exec()
   await Promise.all(
     res.map(async (prop)=>{
       if(prop.tfesPic && prop.tfesPic!==''){
         const userAccount=await this.usersService.findOnePic(prop.tfesPic);
         prop.set(`TfesPic`,userAccount.firstName+' '+userAccount.lastName,{
           strict:false,
         });
       }
     }),
   );
    return res;
  }

  async findOne(id: string):Promise<StockExpense> {
    let res=await this.stockExpenseModel.findById(id)
    if(res.tfesPic && res.tfesPic!==''){
      const userAccount=await this.usersService.findOnePic(res.tfesPic);
      res.set(`TfesPic`,userAccount.firstName+' '+userAccount.lastName,{
        strict:false
      });
    };
   
    return res;
  }

  async update(id: string, updateStockExpenseDto: UpdateStockExpenseDto):Promise<StockExpense> {
    const stockExpense=await this.stockExpenseModel.findOne({_id:id}).exec();
    if(!stockExpense){
      throw new InternalServerErrorException(`This Stock-Expense doesn't exist`);
    }

    const {status}=stockExpense;
    if(status ==='closed'){
      throw new ForbiddenException(
        `Stock-Expense are has been closed, Update is forbidden`
      );
    }
    if(updateStockExpenseDto.status==='confirmed' && 
      updateStockExpenseDto.status!==status
    ){
      updateStockExpenseDto.status='closed';
      //remove stock
      const createStockOperationDto = new CreateStockOperationDto();
      createStockOperationDto.type = "internal";      
      //find scrap destination
      let destination = await this.stockLoctionService.getStockByName("Scrap");
      if(destination){
        createStockOperationDto.destination = destination._id;
      }
      createStockOperationDto.moveItems = [];
      updateStockExpenseDto.stockExpenseItem.forEach(item => {
        const createStockMoveDto = {} as StockMove;
        createStockMoveDto.productId = item.productId;
        createStockMoveDto.skuId = item.skuId;
        createStockMoveDto.qty = item.qty;
        createStockOperationDto.moveItems.push(createStockMoveDto);
      })

      await this.stockOperationService.removeStock(createStockOperationDto);

       await this.stockExpenseModel.findByIdAndUpdate(
        { _id: id },
          updateStockExpenseDto,
        { new: true }
      );
    }
    else if(updateStockExpenseDto.status=='draft'){
      await this.stockExpenseModel.findByIdAndUpdate(
        {_id:id},
        updateStockExpenseDto,
        {new:true}
      )
    }
    const result=await this.findOne(id)
    return result;
  }

  async remove(id: string) {
      // find sales oder by ID
      const stockExpenseFound = await this.stockExpenseModel
      .findOne({ _id: id })
      .exec();

    if (!stockExpenseFound) {
      throw new InternalServerErrorException(`This stock-expense doesn't exist`);
    }
    const response=await this.stockExpenseModel.findByIdAndRemove(id);

    return response;
  }
}
