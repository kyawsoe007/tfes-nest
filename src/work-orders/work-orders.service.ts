import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import {
  SalesOrder,
  SalesOrderItems,
} from 'src/sales-orders/interfaces/sales-orders.interface';
import {
  WorkOrder,
  WorkOrderObject,
  WoStatusEnum,
  WorkOrderItems,
} from './interfaces/work-orders.interface';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { BomsService } from 'src/boms/boms.service';
import { SkusService } from 'src/skus/skus.service';
import { ProductsService } from 'src/products/products.service';
import { WorkOrderPickingsService } from 'src/work-order-pickings/work-order-pickings.service';
import { SalesOrdersService } from 'src/sales-orders/sales-orders.service';
import {
  CreateWorkOrderPickingDto,
  WoPickingStatusEnum,
} from 'src/work-order-pickings/dto/create-work-order-picking.dto';
import { PackingListsService } from 'src/packing-lists/packing-lists.service';
import { SalesStatusEnumDto } from '../sales-orders/dto/create-sales-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { DeliveryLineStatusEnum } from '../delivery-orders/delivery-orders.interface';
import { FilterDto } from 'src/shared/filter.dto';
import { DeliveryWorkItemsService } from '../delivery-work-items/delivery-work-items.service';
import { ConfirmWoItemDto } from './dto/confirm-work-item.dto';
import { WorkOrderPicking } from '../work-order-pickings/work-order-pickings.interface';
import { StockOperationService } from '../stock-operation/stock-operation.service';
import { UpdateSkusDto } from '../skus/dto/update-skus.dto';
import { DeliveryOrdersService } from '../delivery-orders/delivery-orders.service';
import { JournalEntryService } from '../journal-entry/journal-entry.service';
import { Sku } from '../skus/skus.interface';
import { RsvdDto } from '../skus/dto/create-skus.dto';
import { soDoStatusEnum } from '../sales-orders/interfaces/sales-orders-status.interface';
import { StockMoveService } from '../stock-move/stock-move.service';
import { UsersService } from 'src/users/users.service';
import { OnResetWoItemDto } from './dto/reset-work-item.dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectModel('WorkOrder')
    private readonly workOrderModel: Model<WorkOrder>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly bomsService: BomsService,
    @Inject(forwardRef(() => SkusService))
    private skusService: SkusService,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    private readonly workOrderPickingsService: WorkOrderPickingsService,
    @Inject(forwardRef(() => SalesOrdersService))
    private salesOrdersService: SalesOrdersService,
    private readonly deliveryWorkItemsService: DeliveryWorkItemsService,
    @Inject(forwardRef(() => StockOperationService))
    private readonly stockOperationService: StockOperationService,
    private readonly deliveryOrdersService: DeliveryOrdersService,
    private readonly packingListsService: PackingListsService,
    private readonly journalEntryService: JournalEntryService,
    @Inject(forwardRef(() => StockMoveService))
    private readonly stockMoveService: StockMoveService,
    private readonly userService: UsersService
  ) {}

  async updateWorkOrder(id: string, updateWorkOrderDto: UpdateWorkOrderDto) {
    console.log('<====== ON UPDATE WORKORDER================>');
    // get workOrderItems before update
    const currentWo = await this.workOrderModel.findById(id);

    // console.log('updateWorkOrderDto', updateWorkOrderDto);

    const keys = [
      'runningNum',
      'workType',
      'completedDate',
      'completedBy',
      'qty',
      'description',
      'sku',
      'productId',
      'bom',
      'remark',
      'doStatus',
      'isCreatedDo',
      'uom',
      'woItemId',
      'woItemStatus',
      'confirmQty',
      'latestQtyInput',
    ];
    for (let i = 0; i < currentWo.workOrderItems.length; i++) {
      for (let j = 0; j < updateWorkOrderDto.workOrderItems.length; j++) {
        if (
          updateWorkOrderDto.workOrderItems[j].id ==
          currentWo.workOrderItems[i]._id
        ) {
          updateWorkOrderDto.workOrderItems[j]._id =
            currentWo.workOrderItems[i]._id;

          for (let k = 0; k < keys.length; k++) {
            if (
              updateWorkOrderDto.workOrderItems[j][keys[k]] === undefined &&
              currentWo.workOrderItems[i][keys[k]]
            ) {
              updateWorkOrderDto.workOrderItems[j][keys[k]] =
                currentWo.workOrderItems[i][keys[k]];

              delete updateWorkOrderDto.workOrderItems[j].status;
            }
          }
        }
      }
    }

    const newWorkOrder = await this.workOrderModel.findByIdAndUpdate(
      id,
      updateWorkOrderDto,
      { new: true },
    );

    // Must do 1st round check before proceed
    const catchPickItemPayload = [];
    for (const woItemDTO of updateWorkOrderDto.workOrderItems) {
      const woPickingListDB = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemId(
        woItemDTO._id,
      );

      if (woPickingListDB) {
        for (const pickingItemDTO of woItemDTO.woPickingList) {
          if (pickingItemDTO.pickedSkuId) {
            if (pickingItemDTO.woPickingStatus === WoPickingStatusEnum.Open) {
              // user submission - Open Status only

              // await this.inspectOfSkuQtySubmissionBasedLocation(
              //   pickingItemDTO,
              //   currentWo._id,
              //   woItemDTO._id,
              // );

              catchPickItemPayload.push(pickingItemDTO);
            }
          }
        }
      }
    }

    await this.inspectOfSkuQtySubmissionBasedLocation(catchPickItemPayload);
    await this.inspectOfSkuQtySubmission(catchPickItemPayload);

    const catchWoPickingDB = [];
    const woPickingByWoId = await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
      newWorkOrder._id,
    );

    for (const woPickingDB of woPickingByWoId) {
      if (
        woPickingDB.pickedSkuId &&
        woPickingDB.woPickingStatus === WoPickingStatusEnum.Reserved
      ) {
        catchWoPickingDB.push(woPickingDB);
      }
    }

    await this.onRemoveSKUReserveBeforeOrAfterCompletion(catchWoPickingDB);

    const pickingListArray = [];
    for (const woItemDTO of updateWorkOrderDto.workOrderItems) {
      const woPickingListDB = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemId(
        woItemDTO._id,
      );

      if (woPickingListDB) {
        for (const pickingItemDTO of woItemDTO.woPickingList) {
          const woPickingItemDB = woPickingListDB.find(
            (woPickingitem) =>
              String(woPickingitem._id) == String(pickingItemDTO.woPickingId),
          );

          if (pickingItemDTO.pickedSkuId) {
            if (
              pickingItemDTO.woPickingStatus !== WoPickingStatusEnum.Completed
            ) {
              const skuData = await this.skusService.findOneSkuOnly(
                pickingItemDTO.pickedSkuId,
              );

              if (skuData) {
                console.log('skuData', skuData);
                const rsvd = skuData.rsvd.find(
                  (item) =>
                    String(item.woId) == String(currentWo._id) &&
                    String(item.woItemId) == String(woItemDTO._id),
                );

                if (rsvd) {
                  rsvd.qty = rsvd.qty + pickingItemDTO.workQty;
                  await skuData.save();
                } else {
                  const rsvdPayload = {
                    woId: currentWo._id,
                    woItemId: woItemDTO._id,
                    qty: pickingItemDTO.workQty,
                  };

                  await this.skusService.updateRsvd(skuData._id, rsvdPayload);
                }
              } else {
                console.log('sku not found in rsvd');
              }
            }

            // ===================================================>
            // Change status from completed to reserved

            if (pickingItemDTO.woPickingStatus === WoPickingStatusEnum.Open) {
              pickingItemDTO.woPickingStatus = WoPickingStatusEnum.Reserved;
            }
          }

          // if (pickingItemDTO.checkConfirmWoItem !== true) {
          //   inProgressItem.push(pickingItemDTO.checkConfirmWoItem);
          // }

          pickingItemDTO.workOrderId = id;
          pickingItemDTO.woItemId = woItemDTO.id;
          pickingItemDTO._id = pickingItemDTO.woPickingId; // Added by PickItem Id
          pickingItemDTO.partialCount = woPickingItemDB
            ? woPickingItemDB.partialCount
            : undefined;
          pickingItemDTO.checkConfirmWoItem = woPickingItemDB
            ? woPickingItemDB.checkConfirmWoItem
            : false;
          pickingItemDTO.bomQtyInput = woPickingItemDB
            ? woPickingItemDB.bomQtyInput
            : undefined;

          pickingListArray.push(pickingItemDTO);
        }
      }
    }

    await this.workOrderPickingsService.updateWorkOrderPickingByDeleteAndInsertMany(
      id,
      pickingListArray,
    );

    return await this.findOneWorkOrder(id);
  }

  async inspectOfSkuQtySubmission(
    woPickingList: WorkOrderPicking[],
  ): Promise<boolean> {
    if (woPickingList && woPickingList.length > 0) {
      for (const item of woPickingList) {
        const skuData = await this.skusService.findOneSkuOnly(item.pickedSkuId);

        if (skuData) {
          item.pickedProduct = skuData.product;
        }
      }
      const uniqueProductInWoPickingLists = await this.findUniqueProductInWorkPickingList(
        woPickingList,
      );

      if (
        uniqueProductInWoPickingLists &&
        uniqueProductInWoPickingLists.length > 0
      ) {
        for (const item of uniqueProductInWoPickingLists) {
          const skuFound = await this.skusService.findSkuBelongsToProduct(
            item.pickedProduct,
          );

          if (skuFound) {
            // Total up sku reserved qty belong to this product
            let sumUpReservedQty = 0;
            for (const sku of skuFound) {
              let skuReserved = 0;
              if (sku.rsvd && sku.rsvd.length > 0) {
                skuReserved = sku.rsvd
                  .map((item) => item.qty)
                  .reduce((accumulator, current) => accumulator + current);
              }
              sumUpReservedQty += skuReserved;
            }

            // Total up qty belongs to this product
            let sumUpSkuQty = 0;
            skuFound.forEach((sku) => {
              sumUpSkuQty += sku.quantity;
            });

            // console.log('totalSkuQty', sumUpSkuQty);
            // console.log('totalReserved', sumUpReservedQty);
            const balanceSkuAvailable = sumUpSkuQty - sumUpReservedQty;
            // console.log('balanceSkuAvailable', balanceSkuAvailable);
            // console.log('totalUserInput', item.totalWorkQty);
            console.log('============"');
            if (item.totalWorkQty > balanceSkuAvailable) {
              // console.log('Insufficient Quantiy');
              throw new BadRequestException(
                'Insufficient of quantites to reserve items',
              );
            }
          }
        }
      }
    }
    return true;
  }

  async inspectOfSkuQtySubmissionBasedLocation(
    woPickingList: WorkOrderPicking[],
  ): Promise<boolean> {
    if (woPickingList && woPickingList.length > 0) {
      const uniqueSkuInWoPickingLists = await this.findUniqueSkuInWorkPickingList(
        woPickingList,
      );

      // console.log('uniqueSkuInWoPickingLists', uniqueSkuInWoPickingLists);

      if (uniqueSkuInWoPickingLists && uniqueSkuInWoPickingLists.length > 0) {
        for (const item of uniqueSkuInWoPickingLists) {
          const sku = await this.skusService.findOneSkuOnly(item.pickedSkuId);

          if (sku) {
            // Total up sku reserved qty belong to this product
            let sumUpReservedQty = 0;

            let skuReserved = 0;
            if (sku.rsvd && sku.rsvd.length > 0) {
              skuReserved = sku.rsvd
                .map((item) => item.qty)
                .reduce((accumulator, current) => accumulator + current);
            }
            sumUpReservedQty += skuReserved;
            console.log('sku', sku);

            const skuAvailable = sku.quantity - sumUpReservedQty;

            // console.log('sumUpReservedQty', sumUpReservedQty);
            // console.log('skuAvailable', skuAvailable);
            // console.log('totalUserInput', item.totalWorkQty);

            if (item.totalWorkQty > skuAvailable) {
              throw new BadRequestException(
                'user inputs exceeded the SKU quantity',
              );
            }
          }
        }
      }
    }
    return true;
  }

  // Completed WO to show at SalesOrder
  async findCompletedWorkOrderItemBySalesOrderId(
    salesOrderId: string,
  ): Promise<WorkOrderItems[]> {
    const workOrder = await this.findWorkOrderBySalesOrderId(salesOrderId);
    if (!workOrder) {
      throw new NotFoundException('Work Order not found');
    }
    console.log('<================ SHOW TO SALESORDER ======>');
    // No Longer check workOrderItem to complete in order to create for DO listing on SO
    const filterCompleted = [];
    // const reduceMethodOutPut = [];
    const insertWoPickingListArr = [];

    for (const woItem of workOrder.workOrderItems) {
      const woPickingListDB = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemId(
        woItem._id,
      );

      if (woPickingListDB) {
        for (const pickingItem of woPickingListDB) {
          const newWoItemPayload = {
            woItemStatus: woItem.woItemStatus,
            woPickingStatus: pickingItem.woPickingStatus,
            workType: woItem.workType,
            qty: woItem.confirmQty, // only use for Pick Pack
            checkConfirmWoItem: pickingItem.checkConfirmWoItem,
            uom: woItem.uom,
            description: woItem.description,
            productId: woItem.productId,
            skuId: woItem.skuId,
            runningNum: woItem.runningNum,
            workQty: pickingItem.workQty,
            woItemId: woItem._id,
            partialCount: pickingItem.partialCount,
            latestQtyInput: woItem.latestQtyInput,
            bomQtyInput: pickingItem.bomQtyInput,
            _id: pickingItem._id, // woItem._id, or undefiend -- need to reconfirmed
          };
          insertWoPickingListArr.push(newWoItemPayload);
        }
      }
    }

    //  console.log('insertWoPickingListArr', insertWoPickingListArr);
    // find existing partialCount belongs to this woItem
    const filterOutUndefinedPartialCount = insertWoPickingListArr.filter(
      (item) => item.partialCount,
    );

    // console.log(
    //   'filterOutUndefinedPartialCount',
    //   filterOutUndefinedPartialCount,
    // );

    // Group partial, accumulate total workQty and unify ?? SHIT
    // get total count for each partial count
    const calculatedPartialQtyArr = this.calculateWoPickingItemsAndPartialCount(
      filterOutUndefinedPartialCount,
    );

    // console.log('calculatedPartialQtyArr', calculatedPartialQtyArr);

    // collect unique partialCount
    const distinctPartialCountOutput = filterOutUndefinedPartialCount.reduce(
      (accumulator, current) => {
        if (
          !accumulator.some(
            (woPicking) =>
              woPicking.woItemId === current.woItemId &&
              woPicking.partialCount === current.partialCount,
          )
        ) {
          accumulator.push(current);
        }
        return accumulator;
      },
      [],
    );

    // console.log('distinctPartialCountOutput', distinctPartialCountOutput);

    // logic goes here to determine when to show or no show on Sales Order List
    for (const item of distinctPartialCountOutput) {
      const woPickItem = calculatedPartialQtyArr.find(
        (calculated) =>
          calculated.woItemId === item.woItemId &&
          calculated.partialCount === item.partialCount,
      );

      // console.log('woPickItem', woPickItem);
      const doWoItems = await this.deliveryWorkItemsService.findAllDoWoItemsByWoItemIdAndPartialCount(
        item.woItemId,
        item.partialCount,
      );

      if (woPickItem.bomQtyInput) {
        console.log('ASSEMBLY');

        // FOR ASSEMBLY
        if (doWoItems && doWoItems.length) {
          console.log('existingBOM =========> existing BOM');
          //      console.log('Get total qty from splited array');
          const initialValue = 0;
          const totalQty = doWoItems.reduce(
            (accumulator, currentValue) => accumulator + currentValue.qty,
            initialValue,
          );

          //    console.log('what is totalQty', totalQty);
          //     console.log('what is itemqty', item.totalWorkQty);
          item.balanceQty = item.bomQtyInput - totalQty;
          // console.log('item.balanceQty', item.balanceQty);

          if (item.balanceQty !== 0) {
            filterCompleted.push(item);
          }
        } else {
          //     console.log('======================> BOM New');
          console.log('DoItem not exist, show without calculation');
          item.balanceQty = woPickItem.bomQtyInput;
          filterCompleted.push(item);
        }
      } else {
        // FOR PICK PACK
        console.log('PICK PACK');
        if (doWoItems && doWoItems.length) {
          const initialValue = 0;
          const totalQty = doWoItems.reduce(
            (accumulator, currentValue) => accumulator + currentValue.qty,
            initialValue,
          );
          item.balanceQty = woPickItem.totalWorkQty - totalQty;

          if (item.balanceQty !== 0) {
            filterCompleted.push(item);
          }
        } else {
          console.log('DoItem not exist, show without calculation');
          item.balanceQty = woPickItem.totalWorkQty;
          filterCompleted.push(item);
        }
      }
    }
    //  console.log('filterCompleted', filterCompleted);
    return filterCompleted;
  }

  // CALCULATION PICKING PARTIAL
  calculateWoPickingItemsAndPartialCount(partialCountArr: any) {
    const uniqueWoPickingItems = partialCountArr.reduce(
      (accumulator, current) => {
        if (
          !accumulator.some(
            (woPickingItem) =>
              woPickingItem.woItemId === current.woItemId &&
              woPickingItem.partialCount === current.partialCount,
          )
        ) {
          accumulator.push(current);
        }
        return accumulator;
      },
      [],
    );
    // console.log('uniqueWoPickingItems', uniqueWoPickingItems);
    const outputArr = [];

    for (const uniqueWoPickingItem of uniqueWoPickingItems) {
      const reGroupWoPickingItems = partialCountArr.filter((item) => {
        if (
          item.woItemId === uniqueWoPickingItem.woItemId &&
          item.partialCount === uniqueWoPickingItem.partialCount
        ) {
          return uniqueWoPickingItem;
        }
      });

      // console.log(reGroupWoPickingItems);

      let accumulatedWorkQty = 0;
      for (const woPickingItem of reGroupWoPickingItems) {
        accumulatedWorkQty += woPickingItem.workQty;
      }

      const refinedPartialCountQty = {
        totalWorkQty: accumulatedWorkQty,
        partialCount: uniqueWoPickingItem.partialCount,
        bomQtyInput: uniqueWoPickingItem.bomQtyInput,
        woItemId: uniqueWoPickingItem.woItemId,
      };
      outputArr.push(refinedPartialCountQty);
    }

    return outputArr;
  }

  async confirmWoItemQty(
    woItemId: string,
    confirmWoItemDto: ConfirmWoItemDto,
  ): Promise<WorkOrder> {
    console.log('CONFIRM QTY START===============================>');
    console.log('FLOW 1');

    const workOrder = await this.getWorkOrderbyId(confirmWoItemDto.workOrderId);

    console.log('User Input Quantity', confirmWoItemDto.confirmQty);
    console.log('confirmWoItemDto', confirmWoItemDto);

    if (workOrder) {
      const { workOrderItems } = confirmWoItemDto;

      if (workOrderItems) {
        const woItemQty = workOrderItems.qty;
        const woConfirmQty = workOrderItems.confirmQty;

        if (!confirmWoItemDto.confirmQty) {
          throw new BadRequestException('Kindly insert quantity');
        }

        workOrderItems.confirmQty = workOrderItems.confirmQty || 0;
        workOrderItems.latestQtyInput = workOrderItems.latestQtyInput || 0;

        const balanceQtyToComplete = woItemQty - woConfirmQty;

        if (confirmWoItemDto.confirmQty <= balanceQtyToComplete) {
          const woPickingList = await this.workOrderPickingsService.findAllWorkOrderPickingsItemByWoItemId(
            woItemId,
          );

          //   console.log('woPickingList', woPickingList);

          if (woPickingList) {
            const onlyReservedWoPickingList = confirmWoItemDto.workOrderItems.woPickingList.filter(
              (item) => item.status === WoPickingStatusEnum.Reserved,
            );

            if (!onlyReservedWoPickingList) {
              throw new BadRequestException(
                'No Reserved SKU has been submitted',
              );
            }

            // check if any unsaved items after changed of selected sku
            const catchUnsavedPickedSkuLineItem = [];
            for (const reservedWoPickingItem of onlyReservedWoPickingList) {
              const unSavedLine = woPickingList.find(
                (itemDb) =>
                  String(itemDb._id) ===
                    String(reservedWoPickingItem.woPickingId) &&
                  String(itemDb.pickedSkuId) !==
                    String(reservedWoPickingItem.pickedSkuId),
              );
              if (unSavedLine) {
                console.log('User changed sku without saving it', unSavedLine);
                catchUnsavedPickedSkuLineItem.push(
                  reservedWoPickingItem.runningNum,
                );
              }
            }

            if (catchUnsavedPickedSkuLineItem.length > 0) {
              console.log('Line no catched', catchUnsavedPickedSkuLineItem);
              for (const runningNum of catchUnsavedPickedSkuLineItem) {
                throw new BadRequestException(
                  `Picked SKU on Line no ${runningNum} was changed, kindly RESELECT and SAVE again`,
                );
              }
            }

            // reassign only reserved sku to woPickingList to do the calculation
            workOrderItems.woPickingList = onlyReservedWoPickingList;

            console.log(
              'workOrderItems.woPickingList',
              workOrderItems.woPickingList,
            );

            if (workOrderItems.workType === 'Pick/Pack') {
              console.log('== PICK/PACK ONLY ===');

              // Selected WorkPicking To Confirm - Get Inital Qty of each sku Item FOR PICKPACK
              const refinedSelectedWoPickingList = this.calculateWoPickingItemsAndQty(
                workOrderItems.woPickingList,
              );

              console.log(
                'refinedSelectedWoPickingList',
                refinedSelectedWoPickingList,
              );
              if (
                refinedSelectedWoPickingList[0].workQty ===
                confirmWoItemDto.confirmQty
              ) {
                // UPDATE WORKPICKING STATUS
                //Saving update status to completed
                const updatedWorkPick = await this.updateWorkPickingstatusToConfirm(
                  workOrderItems,
                  confirmWoItemDto.confirmQty,
                );

                // UPATE WORKORDERITEM STATUS
                // Pass in workitem, to check if woitem able to close this woItem
                await this.CheckToCompleteWorkOrderItemStatus(
                  woItemId,
                  confirmWoItemDto.workOrderId,
                  confirmWoItemDto.confirmQty, // user qty passing over the function
                );

                // CREATE STOCK OPERATION
                await this.stockOperationService.createOutgoingStockMoveFromWorkOrder(
                  updatedWorkPick,
                  workOrder,
                  // workOrderItems.description,
                );

                await this.onDeductReservedSKU(updatedWorkPick);

                // return await this.findOneWorkOrder(workOrder._id);
              } else {
                throw new BadRequestException(
                  `Incorrect quantity input, it should be ${refinedSelectedWoPickingList[0].workQty}`,
                );
              }
            } else {
              console.log('=== Assembly Only ===');
              // Selected WorkPicking To Confirm - Get Inital Qty of each sku Item FOR PICKPACK
              const refinedSelectedWoPickingList = this.calculateWoPickingItemsAndQty(
                workOrderItems.woPickingList,
              );

              // WorkPicking - Get Inital qty of each sku Item FOR ASSEMBLY
              const refinedWoPickingList = this.calculateWoPickingItemsAndQty(
                woPickingList,
              );

              // console.log('refinedWoPickingList', refinedWoPickingList);

              // Define updatedWorkPick use for stockOperation later
              let updatedWorkPick: WorkOrderPicking[];
              let toProceed = false;
              for (const refinedwoPickingItem of refinedWoPickingList) {
                const initialQty = refinedwoPickingItem.workQty / woItemQty;

                for (const selectedWoPickingItem of refinedSelectedWoPickingList) {
                  if (
                    String(selectedWoPickingItem.sku) ==
                    String(refinedwoPickingItem.sku)
                  ) {
                    const multipliedQty =
                      confirmWoItemDto.confirmQty * initialQty;

                    if (multipliedQty == selectedWoPickingItem.workQty) {
                      console.log('CAN PROCEED');
                      toProceed = true;
                    } else {
                      console.log('CANNOT PROCEED');
                      throw new BadRequestException(
                        'Incorrect portion of quantity',
                      );
                    }
                  }
                }

                // const selectedWoPickingList = refinedSelectedWoPickingList.find(
                //   (selectedWoPickingItem) =>
                //     String(selectedWoPickingItem.sku) ==
                //     String(refinedwoPickingItem.sku),
                // );

                // console.log('selectedWoPickingList', selectedWoPickingList);

                // confirmedQty * initialQty must be equal to selectedQWoPickingList.workQty otherwise false
                // const multipliedQty = confirmWoItemDto.confirmQty * initialQty;

                // if (multipliedQty == selectedWoPickingList.workQty) {
                //   console.log('CAN PROCEED');
                //   toProceed = true;
                // } else {
                //   console.log('CANNOT PROCEED');
                //   throw new BadRequestException(
                //     'Incorrect portion of quantity',
                //   );
                // }
              }

              // ===== OutSide of Loop ====

              // Catch Proceed Boolean
              if (toProceed) {
                updatedWorkPick = await this.updateWorkPickingstatusToConfirm(
                  workOrderItems,
                  confirmWoItemDto.confirmQty,
                );

                // Pass in workitem, to check if woitem able to complete in status
                await this.CheckToCompleteWorkOrderItemStatus(
                  woItemId,
                  confirmWoItemDto.workOrderId,
                  confirmWoItemDto.confirmQty, // user qty passing over the function
                );

                // CREATE STOCK OPERATION
                if (updatedWorkPick && updatedWorkPick.length > 0) {
                  console.log('=== CREATING STOCK OPERATION ===');
                  //console.log('what is updatedWorkPick', updatedWorkPick);
                  await this.stockOperationService.createOutgoingStockMoveFromWorkOrder(
                    updatedWorkPick,
                    workOrder,
                    // workOrderItems.description,
                  );

                  // REMOVE RESERVED SKU
                  console.log('=== REMOVE RESERVED STOCK ARRAY CATCHED ===');

                  await this.onDeductReservedSKU(updatedWorkPick);

                  console.log('=== INCREASE PRODUCT QUANTIY ===');
                  const sku = await this.skusService.findOneSkuByProductId(
                    workOrderItems.productId,
                  );
                  //console.log('SKU FOUND', sku);

                  if (sku) {
                    const updateSkuDTO: UpdateSkusDto = {
                      quantity: sku.quantity + confirmWoItemDto.confirmQty,
                    };
                    await this.skusService.updateSku(sku._id, updateSkuDTO);
                    //console.log('SKU UPDATED QUANTITY', response);
                  } else {
                    // this throw error are rare case
                    throw new NotFoundException('SKU not found');
                  }
                }
              }
            }
          } else {
            throw new BadRequestException('Work Picking Items not found');
          }
        } else {
          console.log(
            'Input Quantiy is more the total workorder item quantity',
          );
          throw new BadRequestException(
            'Input Quantiy is more the total workorder item quantity',
          );
        }
        // Check to complete WorkOrder
        await this.updateWorkOrderStatusAndSoStatus(workOrder);
        return workOrder;
        // FINAL RETURN FIND ONE =====>
        // return await this.findOneWorkOrder(workOrder._id);
      } else {
        throw new BadRequestException('WorkOrder Item has not been submitted');
      }
    } else {
      throw new NotFoundException('WorkOrder not found');
    }
  }

  async updateWorkOrderStatusAndSoStatus(workOrder: WorkOrder) {
    const woPickingListDB = await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
      workOrder._id,
    );
    const inProgressItem = [];
    const woPickingListDBLength = woPickingListDB.length;
    console.log('woPickingListDBLength', woPickingListDBLength);

    for (const woPickingItem of woPickingListDB) {
      if (woPickingItem.checkConfirmWoItem !== true) {
        inProgressItem.push(woPickingItem.checkConfirmWoItem);
      }
    }

    console.log('inProgressItem', inProgressItem);

    if (inProgressItem && inProgressItem.length === 0) {
      console.log('WorkOrder is completed');
      workOrder.woStatus = WoStatusEnum.Completed;
      workOrder.completedDate = new Date();

      // Update SalesOrder woStatus to completed
      await this.salesOrdersService.updateWorkOrderStatus(
        workOrder.orderId,
        workOrder.woStatus,
      );
      return await workOrder.save();
    } else if (woPickingListDBLength === inProgressItem.length) {
      console.log('WorkOrder is open');

      workOrder.woStatus = WoStatusEnum.Open;
      await this.salesOrdersService.updateWorkOrderStatus(
        workOrder.orderId,
        workOrder.woStatus,
      );
      await workOrder.save();
    } else {
      console.log('WorkOrder is process');
      workOrder.woStatus = WoStatusEnum.Processing;

      // Update SalesOrder woStatus to processing
      await this.salesOrdersService.updateWorkOrderStatus(
        workOrder.orderId,
        workOrder.woStatus,
      );
      return await workOrder.save();
    }
  }

  async updateWorkPickingstatusToConfirm(
    workItem: any, // Wait for edmund regard to DTO sturcture
    confirmQty: number,
  ): Promise<any> {
    console.log('updateWorkPickingstatusToConfirm, FLOW 3');
    // console.log('selectedWoPicking', workItem.woPickingList);
    // console.log('what is workItem', workItem);
    // console.log('what is user confirmQty', confirmQty);

    const woPickingList = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemIdAndPartialCountExisted(
      workItem.woItemId,
    );

    let highestAmount = 1;
    if (woPickingList && woPickingList.length > 0) {
      const partialCountArr = woPickingList.map((item) => item.partialCount);
      console.log('partialCountArr', partialCountArr);
      highestAmount =
        partialCountArr.reduce((max, partialCount) =>
          partialCount > max ? partialCount : max,
        ) + 1;
    }

    console.log('highestAmount', highestAmount);
    const catchResponse = [];
    let response;
    for (const woPickingItem of workItem.woPickingList) {
      console.log('what is woPickingitem', woPickingItem);
      if (woPickingItem) {
        const status = WoPickingStatusEnum.Completed;
        response = await this.workOrderPickingsService.updateWorkOrderPickingStatus(
          woPickingItem.woPickingId,
          workItem,
          status,
          highestAmount,
          confirmQty,
        );
        catchResponse.push(response);
      }
    }
    return catchResponse;
  }

  //  must pass in woItem to check to update wopicking status and workItem status
  async CheckToCompleteWorkOrderItemStatus(
    woItemId: string,
    workOrderId: string,
    confirmQty: number,
  ): Promise<WorkOrder> {
    const inProgressItem = [];

    console.log('CheckToCompleteWorkOrderItemStatus FLOW 4');
    console.log('confirmQty', confirmQty);
    console.log('woItemid', woItemId);

    // Find woPickingOrder by woItemId
    const woPickingList = await this.workOrderPickingsService.findAllWorkOrderPickingsItemByWoItemId(
      woItemId,
    );
    let response: WorkOrder;
    if (woPickingList && woPickingList.length > 0) {
      for (const woPickingItem of woPickingList) {
        // can you array.every() next time
        if (woPickingItem.woPickingStatus !== WoPickingStatusEnum.Completed) {
          inProgressItem.push(woPickingItem.woPickingStatus);
        }
      }

      console.log('inProgress', inProgressItem);

      //This is the finalized workOrdert Item to Confirmed or default
      if (inProgressItem && inProgressItem.length === 0) {
        console.log('are you in here to complete this workorder');
        const status = WoStatusEnum.Completed;
        console.log('what is status', status);
        response = await this.updateWoItemStatusByWoIdAnWoItemId(
          woItemId,
          workOrderId,
          status,
          confirmQty, // Passing over the function user Input qty
        );

        // End HEre
      } else {
        const status = WoStatusEnum.Processing;
        console.log('what is status', status);
        response = await this.updateWoItemStatusByWoIdAnWoItemId(
          woItemId,
          workOrderId,
          status,
          confirmQty, // Passing over the function user Input qty
        );
      }
    } else {
    }
    return response;
  }

  calculateWoPickingItemsAndQty(woPickingList: WorkOrderPicking[]) {
    if (woPickingList && woPickingList.length > 0) {
      const uniqueWoPickingItems = woPickingList.reduce(
        (accumulator, current) => {
          if (
            !accumulator.some(
              (woPickingItem) =>
                String(woPickingItem.skuId) === String(current.skuId),
            )
          ) {
            accumulator.push(current);
          }
          return accumulator;
        },
        [],
      );

      const refinedWoPickingItems = [];

      for (const uniqueWoPickingItem of uniqueWoPickingItems) {
        const reGroupWoPickingItems = woPickingList.filter((item) => {
          if (String(item.skuId) === String(uniqueWoPickingItem.skuId)) {
            return uniqueWoPickingItem;
          }
        });

        // console.log(reGroupWoPickingItems);

        let accumulatedWorkQty = 0;
        for (const woPickingItem of reGroupWoPickingItems) {
          accumulatedWorkQty += woPickingItem.workQty;
        }

        const refinedWoItemPayload = {
          workQty: accumulatedWorkQty,
          sku: uniqueWoPickingItem.skuId,
        };
        refinedWoPickingItems.push(refinedWoItemPayload);
      }
      return refinedWoPickingItems;
    } else {
      throw new BadRequestException('No Input of user selection');
    }
  }

  // Modified and use back -------------------------> Update status and completedQtyRef
  async updateWoItemStatusByWoIdAnWoItemId(
    woItemId: string,
    workOrderId: string,
    status: string,
    confirmQty: number,
  ): Promise<WorkOrder> {
    console.log('updateWoItemStatusByWoIdAnWoItemId, FLOW 3');
    console.log('what is woitemId', woItemId);
    console.log('what is workorderId', workOrderId);
    console.log('what is status', status);
    const workOrder = await this.workOrderModel.findById(workOrderId);

    if (!workOrder) {
      throw new NotFoundException(` workOrder not found`);
    }

    // To Update woItemStatus
    const woItem = workOrder.workOrderItems.find(
      (woItem) => String(woItem._id) === String(woItemId),
    );
    //  console.log('woItem found', woItem);
    console.log(
      'what is user input updateWoItemStatusByWoIdAnWoItemId',
      confirmQty,
    );
    if (woItem) {
      woItem.woItemStatus = status;
      woItem.confirmQty = woItem.confirmQty + confirmQty;
      woItem.latestQtyInput = confirmQty; // use to show SalesOrder current input qty
    } else {
      console.log(
        'workorderItem not found on updateWoItemStatusByWoIdAnWoItemId',
      );
    }

    return await workOrder.save();
  }

  async createWorkOrderPicking(workOrder: WorkOrder) {
    // Creating Work Order Picking
    await Promise.all(
      workOrder.workOrderItems.map(async (woItem, index) => {
        let woPickingNum = parseFloat(`${woItem.runningNum}.${index + 1}`);

        if (woItem.bom) {
          const bomDb = await this.bomsService.findOne(woItem.bom);

          if (bomDb) {
            // itereate bom's product list
            let numIncrement = 0;
            for (const bomItem of bomDb.productList) {
              // Calculation of workQty
              const totalWorkQty = woItem.qty * bomItem.qty;

              numIncrement++;

              woPickingNum = parseFloat(`${woItem.runningNum}.${numIncrement}`);

              const createWorkOrderPickingDto: CreateWorkOrderPickingDto = {
                workQty: totalWorkQty,
                woItemId: woItem.woItemId,
                skuId: bomItem.sku,
                productId: bomItem.product,
                runningNum: woPickingNum,
                workOrderId: workOrder._id,
                pickedSkuId: undefined,
                woPickingStatus: undefined,
              };

              console.log(
                'bom.productList, created WoPicking',
                createWorkOrderPickingDto.woItemId +
                  createWorkOrderPickingDto.runningNum,
              );

              await this.workOrderPickingsService.createWorkOrderPickingList(
                createWorkOrderPickingDto,
              );
            }
          }
        } else {
          // Non BOM line
          const createWorkOrderPickingDto: CreateWorkOrderPickingDto = {
            workQty: woItem.qty,
            woItemId: woItem.woItemId,
            skuId: woItem.skuId,
            productId: woItem.productId,
            runningNum: woPickingNum,
            workOrderId: workOrder._id,
            pickedSkuId: undefined,
            woPickingStatus: undefined,
          };

          await this.workOrderPickingsService.createWorkOrderPickingList(
            createWorkOrderPickingDto,
          );
        }
      }),
    );
  }

  // =======================================================================================> LOOK ABOVE

  async createWorkOrder(salesOrder: SalesOrder) {
    const workOrder = await this.workOrderModel.findOne({
      orderId: salesOrder._id,
    });

    if (workOrder) {
      throw new BadRequestException(
        'SalesOrder has been generated a workOrder!',
      );
    }

    const modelName = 'WorkOrder'; // hard-coded first

    // 1. GENERATE WONUMBER
    const workOrderSettings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    // const { prefix } = workOrderSettings;
    const { soNumber } = salesOrder;

    const newWoNumber = this.sequenceSettingsService.reformatSettingEx(
      workOrderSettings,
      soNumber,
    );

    const salesOrderItems = salesOrder.salesOrderItems.filter(
      (item) => item.bom || item.sku || item.productId,
    );

    const workOrderPayload = [];
    // salesOrderItems.forEach(async (item) => {
    //   workOrderPayload.push(await this.onCreate(item));
    // });

    for (const item of salesOrderItems) {
      workOrderPayload.push(await this.onCreate(item));
    }

    // CREATE NEW OBJECT AND INSERT WORKORDER
    const workOrderObject: WorkOrderObject = {
      orderId: salesOrder._id,
      workOrderItems: workOrderPayload,
      woNumber: newWoNumber,
      soNumber: soNumber,
    };

    const response = new this.workOrderModel(workOrderObject);

    // 3.SAVE NEW WORKORDER
    console.log('Added new workOrder');
    const createdWorkOrder = await response.save();

    await this.createWorkOrderPicking(createdWorkOrder);

    return createdWorkOrder;
  }

  // persist WO and WoPicking
  async onPersist(soItem: SalesOrderItems, woItem: WorkOrderItems) {
    console.log('Function On Persist');
    console.log('woitem._id', woItem._id);
    console.log('soItem._id', soItem._id);

    const woItemPayload = {
      _id: woItem._id,
      woItemStatus: woItem.woItemStatus,
      // status: woItem.status,
      isCreatedDo: woItem.isCreatedDo,
      doStatus: woItem.doStatus,
      remark: woItem.remark,
      qty: woItem.qty,
      description: woItem.description,
      uom: woItem.uom,
      productId: woItem.productId,
      skuId: woItem.skuId,
      bom: woItem.bom,
      woItemId: woItem._id,
      workType: woItem.workType,
      completedBy: woItem.completedBy,
      completedDate: woItem.completedDate,
      picked: woItem.picked,
      runningNum: woItem.runningNum,
      confirmQty: woItem.confirmQty,
      latestQtyInput: woItem.latestQtyInput,
    };
    // console.log('payload', woItemPayload);
    return woItemPayload;
  }

  // Create WO and WoPicking
  async onCreate(soItem: SalesOrderItems) {
    console.log('Function On Create');
    console.log('soItem._id', soItem._id);

    const woItemPayload = {
      _id: soItem._id, // why this must match So Item Id
      woItemStatus: undefined,
      status: undefined,
      isCreatedDo: undefined,
      doStatus: undefined,
      remark: undefined,
      qty: soItem.qty,
      description: soItem.description,
      uom: soItem.uom,
      productId: soItem.productId,
      skuId: soItem.sku,
      bom: soItem.bom,
      woItemId: soItem._id,
      workType: soItem.bom ? 'Assembly' : 'Pick/Pack',
      completedBy: undefined,
      completedDate: undefined,
      picked: undefined,
      runningNum: soItem.SN,
      confirmQty: 0,
      latestQtyInput: 0,
    };
    return woItemPayload;
  }

  async onCancelSkuReserve(
    woItemId: string,
    workOrder: WorkOrder,
    triggerBy: string,
  ) {
    console.log('=== ON CANCEL SKU RESERVED ===');
    // Remove SKU onReserved
    let workPickings: WorkOrderPicking[];
    if (triggerBy === 'onUpdateSoItem') {
      console.log('On update SalesOrderItem');
      workPickings = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemId(
        woItemId,
      );
    }

    if (triggerBy === 'onCancel') {
      console.log('On Cancel');
      const workPickingsById = await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
        workOrder._id,
      );

      workPickings = workPickingsById.filter(
        (item) => item.woPickingStatus !== WoPickingStatusEnum.Completed,
      );
    }

    if (triggerBy === 'onReset') {
      console.log('On Reset');
      workPickings = await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
        workOrder._id,
      );
    }

    // console.log('what is workPicking', workPickings);

    const pickedSkus = [];
    if (workPickings && workPickings.length > 0) {
      for (const woPickingItem of workPickings) {
        if (woPickingItem.pickedSkuId) {
          pickedSkus.push(String(woPickingItem.pickedSkuId));
        } else {
          console.log('No Sku picked yet');
        }
      }
    } else {
      // rare case to prompt this error
      console.log('no workPickings');
    }

    // If got length then proceed
    if (pickedSkus.length > 0) {
      const uniqueSkus = pickedSkus.filter((sku, index, array) =>
        array.indexOf(sku) === index ? sku : '',
      );

      console.log('unique', uniqueSkus);

      for (const uniqueSku of uniqueSkus) {
        const sku = await this.skusService.findOneSkuOnly(uniqueSku);
        console.log('sku', sku);

        if (sku && sku.rsvd) {
          sku.rsvd;
          console.log('sku.rsvd', sku.rsvd);

          function search(item: { [x: string]: any }) {
            return Object.keys(this).some((key) => item[key] !== this[key]);
          }

          let query: any;
          if (triggerBy === 'onUpdateSoItem') {
            console.log('query onUpdateSoItem');
            query = {
              woId: String(workOrder._id),
              woItemId: String(woItemId),
            };
          }

          if (triggerBy === 'onCancel' || triggerBy === 'onReset') {
            console.log('query cancel or reset');

            query = {
              woId: String(workOrder._id),
            };
            // console.log('what is query', query);
          }

          const skuReserveRemoved = sku.rsvd.filter(search, query);
          // console.log('what is skuReservedremoved', skuReserveRemoved);

          sku.rsvd = skuReserveRemoved;
          await sku.save();
        }
      }
    }

    if (triggerBy === 'onCancel') {
      console.log('workOrder to cancel status');
      workOrder.woStatus = WoStatusEnum.Cancelled;
      return await workOrder.save();
    }
  }

  async onRemoveSKUReserveBeforeOrAfterCompletion(woPickingItem) {
    console.log('On remove SKU woPickingItem', woPickingItem);
    for (const item of woPickingItem) {
      const sku = await this.skusService.findOneSkuOnly(item.pickedSkuId);

      if (sku && sku.rsvd) {
        // console.log(`OnRemoveSkuReserved SkuId ${sku}`);
        // console.log('Sku.rsvd', sku.rsvd);

        function search(item: { [x: string]: any }) {
          return Object.keys(this).some((key) => item[key] !== this[key]);
        }

        const query = {
          woId: String(item.workOrderId),
          woItemId: String(item.woItemId),
        };

        const skuReserveRemoved = sku.rsvd.filter(search, query);
        // console.log('Sku.rsvd after removed', skuReserveRemoved);
        sku.rsvd = skuReserveRemoved;
        await sku.save();
      }
    }
    return woPickingItem;
  }

  async onDeductReservedSKU(woPickingItem: WorkOrderPicking[]) {
    console.log('On onDeductReservedSKU SKU woPickingItem', woPickingItem);
    for (const woPickItem of woPickingItem) {
      const sku = await this.skusService.findOneSkuOnly(woPickItem.pickedSkuId);

      if (sku && sku.rsvd) {
        // console.log(`OnRemoveSkuReserved SkuId ${sku}`);
        // console.log('Sku.rsvd', sku.rsvd);

        const rsvdReservedItem = sku.rsvd.find((rsvdItem) => {
          if (
            String(rsvdItem.woId) === String(woPickItem.workOrderId) &&
            String(rsvdItem.woItemId) === String(woPickItem.woItemId)
          ) {
            return rsvdItem;
          }
        });
        console.log('target rsvdReservedItem', rsvdReservedItem);

        rsvdReservedItem.qty -= woPickItem.workQty;

        // if Rsvd qty still has balance
        if (rsvdReservedItem.qty > 0) {
          await sku.save();
        } else {
          console.log('rsvdReservedItem.qty is', rsvdReservedItem.qty);
          console.log('are you here to remove entire array rsvd');
          const RsvdPayload = sku.rsvd.filter(
            (item) => String(item.woItemId) !== rsvdReservedItem.woItemId,
          );
          sku.rsvd = RsvdPayload;
          await sku.save();
        }
      }
    }
    return woPickingItem;
  }

  async onRemoveSKUReserveIfUnsufficientQty(
    sku: Sku,
    woId: string,
    woItemId: string,
  ) {
    if (sku && sku.rsvd) {
      // console.log(`OnRemoveSkuReserved SkuId ${sku}`);
      // console.log('Sku.rsvd', sku.rsvd);

      function search(item: { [x: string]: any }) {
        return Object.keys(this).some((key) => item[key] !== this[key]);
      }

      const query = {
        woId: String(woId),
        woItemId: String(woItemId),
      };

      const skuReserveRemoved = sku.rsvd.filter(search, query);
      // console.log('Sku.rsvd after removed', skuReserveRemoved);
      sku.rsvd = skuReserveRemoved;
      await sku.save();
    }
  }

  // UpdateWorkOrder if SalesOrder Changing information
  async updateWorkOrderFromSO(salesOrder: SalesOrder) {
    // This is from salesOrder

    const workOrder = await this.workOrderModel.findOne({
      orderId: salesOrder._id,
    });

    if (!workOrder)
      throw new NotFoundException('SalesOrder Id not exist in WorkOrder!');

    if (workOrder.woStatus === WoStatusEnum.Completed)
      throw new BadRequestException(
        'Work order has been completed, request denied',
      );

    const workOrderItemPayload = [];

    console.log('Flow 1');

    for (const soItem of salesOrder.salesOrderItems) {
      const woItem = workOrder.workOrderItems.find(
        (woItem) => String(woItem.woItemId) == String(soItem._id),
      );

      console.log('Flow 2');

      if (woItem) {
        // Check if got any changes
        console.log('Flow 3');
        if (
          String(soItem.productId) != String(woItem.productId) ||
          String(soItem.bom) != String(woItem.bom) ||
          String(soItem.sku) != String(woItem.skuId) ||
          soItem.qty !== woItem.qty
        ) {
          console.log('Flow 4');
          if (woItem.woItemStatus === WoStatusEnum.Open) {
            // WorkOrder in Open Status and SoItem made Changes
            // Allow to wipe-out WoItem
            console.log('Wipe and create new WorkOrder');
            workOrderItemPayload.push(await this.onCreate(soItem));

            // Cancel Sku reversation
            const triggerBy = 'onUpdateSoItem';
            await this.onCancelSkuReserve(woItem._id, workOrder, triggerBy);

            // Remove WoPicking
            await this.workOrderPickingsService.deleteManyByWoItemId(
              woItem.woItemId,
            );

            // Create New WoPicking
            await this.createWorkOrderPickingOnSalesItemChanged(
              soItem,
              workOrder,
            );
          } else {
            // WorkOrder NOT an open Status Mode
            // Cannot wipe WOItem
            // Persist WOitem
            // Persist WoPicking

            console.log(
              'Got Changes while WorkOrder No Longer in Open mode, To Persist',
            );

            workOrderItemPayload.push(await this.onPersist(soItem, woItem));
          }
        } else {
          console.log('Flow 5');
          const woItem = workOrder.workOrderItems.find(
            (woItem) => String(woItem.woItemId) == String(soItem._id),
          );
          // Item No changes,
          // Cannot wipe WOItem
          // Persist WOItem
          // Persist WoPicking

          console.log('No Changes, persist');
          if (woItem) {
            workOrderItemPayload.push(await this.onPersist(soItem, woItem));
          }
        }
      } else {
        if (soItem) {
          console.log('Flow 7');
          console.log('User added new item');
          // Create WoItem
          workOrderItemPayload.push(await this.onCreate(soItem));
          // Create WoPicking
          await this.createWorkOrderPickingOnSalesItemChanged(
            soItem,
            workOrder,
          );
        }
      }
    }

    for (const woItem of workOrder.workOrderItems) {
      const itemMatch = salesOrder.salesOrderItems.find(
        (soItem) => String(woItem.woItemId) == String(soItem._id),
      );

      console.log('Flow 8');
      if (!itemMatch) {
        console.log('Flow 9');
        console.log('Catch removed soItem');

        // Cancel Sku reversation
        const triggerBy = 'onUpdateSoItem';
        await this.onCancelSkuReserve(woItem._id, workOrder, triggerBy); // temp Disable
        // Remove WorkPicking
        await this.workOrderPickingsService.deleteManyByWoItemId(
          woItem.woItemId,
        );
      }
    }

    const updatedWorkOrder = await this.workOrderModel.findOneAndUpdate(
      { orderId: salesOrder._id },
      {
        workOrderItems: workOrderItemPayload, // We update this only
        soNumber: salesOrder.soNumber,
      },
      { new: true },
    );

    return updatedWorkOrder;
  }

  async createWorkOrderPickingOnSalesItemChanged(
    soItem: SalesOrderItems,
    workOrder: WorkOrder,
  ) {
    // Creating Work Order Picking

    if (soItem.bom) {
      const bomDb = await this.bomsService.findOne(soItem.bom);

      if (bomDb) {
        let numIncrement = 0;
        for (const bomItem of bomDb.productList) {
          numIncrement++;
          // Calculation of workQty
          const totalWorkQty = soItem.qty * bomItem.qty;
          const woPickingNum = parseFloat(`${soItem.SN}.${numIncrement}`);
          const createWorkOrderPickingDto: CreateWorkOrderPickingDto = {
            workQty: totalWorkQty,
            woItemId: soItem._id,
            skuId: bomItem.sku,
            productId: bomItem.product,
            runningNum: woPickingNum,
            workOrderId: workOrder._id,
            pickedSkuId: undefined,
            woPickingStatus: undefined,
          };
          await this.workOrderPickingsService.createWorkOrderPickingList(
            createWorkOrderPickingDto,
          );
        }
      }
    } else {
      const createWorkOrderPickingDto: CreateWorkOrderPickingDto = {
        workQty: soItem.qty,
        woItemId: soItem._id,
        skuId: soItem.sku,
        productId: soItem.productId,
        runningNum: parseFloat(`${soItem.SN}.0`),
        workOrderId: workOrder._id,
        pickedSkuId: undefined,
        woPickingStatus: undefined,
      };

      await this.workOrderPickingsService.createWorkOrderPickingList(
        createWorkOrderPickingDto,
      );
    }
  }

  async findUniqueProductInWorkPickingList(
    woPickingList: WorkOrderPicking[],
  ): Promise<any> {
    // console.log(
    //   'woPickingList findUniqueProductInWorkPickingList',
    //   woPickingList,
    // );
    const uniqueWoPickingItems = woPickingList.reduce(
      (accumulator, current) => {
        if (
          !accumulator.some(
            (woPickingItem) =>
              String(woPickingItem.pickedProduct) ===
              String(current.pickedProduct),
          )
        ) {
          accumulator.push(current);
        }
        return accumulator;
      },
      [],
    );

    // console.log('uniqueWoPickingItems', uniqueWoPickingItems);

    const outputArr = [];

    for (const uniqueWoPickingItem of uniqueWoPickingItems) {
      const reGroupWoPickingItems = woPickingList.filter((item) => {
        if (
          String(item.pickedProduct) ===
          String(uniqueWoPickingItem.pickedProduct)
        ) {
          return uniqueWoPickingItem;
        }
      });

      // console.log('regroup', reGroupWoPickingItems);

      let accumulatedWorkQty = 0;
      for (const woPickingItem of reGroupWoPickingItems) {
        accumulatedWorkQty += woPickingItem.workQty;
      }

      const uniqueSkuPayload = {
        pickedProduct: uniqueWoPickingItem.pickedProduct,
        totalWorkQty: accumulatedWorkQty,
      };
      outputArr.push(uniqueSkuPayload);
    }

    return outputArr;
  }

  async findUniqueSkuInWorkPickingList(
    woPickingList: WorkOrderPicking[],
  ): Promise<any> {
    console.log('findUniqueSkuInWorkPickingList', woPickingList);
    const uniqueWoPickingItems = woPickingList.reduce(
      (accumulator, current) => {
        if (
          !accumulator.some(
            (woPickingItem) =>
              String(woPickingItem.pickedSkuId) === String(current.pickedSkuId),
          )
        ) {
          accumulator.push(current);
        }
        return accumulator;
      },
      [],
    );

    console.log('uniqueWoPickingItems', uniqueWoPickingItems);

    const outputArr = [];

    for (const uniqueWoPickingItem of uniqueWoPickingItems) {
      const reGroupWoPickingItems = woPickingList.filter((item) => {
        if (
          String(item.pickedSkuId) === String(uniqueWoPickingItem.pickedSkuId)
        ) {
          return uniqueWoPickingItem;
        }
      });

      // console.log('regroup', reGroupWoPickingItems);

      let accumulatedWorkQty = 0;
      for (const woPickingItem of reGroupWoPickingItems) {
        accumulatedWorkQty += woPickingItem.workQty;
      }

      const uniqueSkuPayload = {
        pickedSkuId: uniqueWoPickingItem.pickedSkuId,
        totalWorkQty: accumulatedWorkQty,
      };
      outputArr.push(uniqueSkuPayload);
    }

    return outputArr;
  }

  async findOneWorkOrder(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderModel.findById(id).exec();

    if (!workOrder) {
      throw new NotFoundException(`Work order not found`);
    }

    const salesOrder = await this.salesOrdersService.getSalesOrder(
      workOrder.orderId,
    );

    if (!salesOrder) {
      throw new NotFoundException('No values from Sales Order');
    }

    if (workOrder.workOrderItems && workOrder.workOrderItems.length > 0) {
      // iterate workOrder Items
      const catchRsvd = [];
      for (let i = 0; i < workOrder.workOrderItems.length; i++) {
        const woListing = await this.workOrderPickingsService.findAllWorkOrderPickingsItemByWoItemId(
          workOrder.workOrderItems[i]._id,
        );

        for (const item of woListing) {
          if (
            item.pickedSkuId &&
            item.woPickingStatus === WoPickingStatusEnum.Reserved
          ) {
            const skuData = await this.skusService.findOneSkuOnly(
              item.pickedSkuId,
            );

            if (skuData) {
              let sumUpReservedQty = 0;

              let skuReserved = 0;
              if (skuData.rsvd && skuData.rsvd.length > 0) {
                skuReserved = skuData.rsvd
                  .map((item) => item.qty)
                  .reduce((accumulator, current) => accumulator + current);
              }
              sumUpReservedQty += skuReserved;
              const skuAvailable = skuData.quantity - sumUpReservedQty;

              if (sumUpReservedQty > skuAvailable) {
                console.log('Exceeded Sku Quantity ============>');
                console.log('SkuQuantity is ', skuData.quantity);
                console.log('Total Reseverd SKU is', sumUpReservedQty);

                if (skuData.rsvd && skuData.rsvd.length > 0) {
                  //const catchRsvd = [];
                  let sumUp = 0;
                  for (const rsvdItem of skuData.rsvd) {
                    sumUp += rsvdItem.qty;
                    //  const balance = sumUpReservedQty - sumUp;
                    // console.log(
                    //   `${sumUpReservedQty} - ${sumUp} = Balance ${balance}: `,
                    // );
                    if (sumUp > skuData.quantity) {
                      rsvdItem.skuId = skuData.id;
                      catchRsvd.push(rsvdItem);
                    }
                  }
                }
              }
            }
          }

          /**
           * onUnPickedSkuIfSkuShortFall() will auto Unreserve SKU of PickekUp workOrder Item if
           * SKU quantity is lesser total reserved Quantity.
           * Also, Pickedsku line will be restored to Open Status and PickedUpSku item will be removed
           * So user allow to re-select new SKU
           */

          await this.onUnPickedSkuIfSkuShortFall(catchRsvd);

          if (item.skuId) {
            const selectedSKU = await this.skusService.findOneSkuForWO(
              item.skuId,
            );
            // get product by product id
            const product = await this.productsService.findOneProductForWO(
              selectedSKU.product,
            );
            // insert sku's location into product
            if (selectedSKU.location) {
              product.set('skuLocation', selectedSKU.location.name, {
                strict: false,
              });
            }
            item.set('product', product, {
              strict: false,
            });
          } else if (item.productId) {
            const product = await this.productsService.findOneProductForWO(
              item.productId,
            );
            item.set('product', product, {
              strict: false,
            });
          }

          if (item.pickedSkuId) {
            const selectedSKU = await this.skusService.findOneSkuForWO(
              item.pickedSkuId,
            );
            // get product by product id
            const product = await this.productsService.findOneProductForWO(
              selectedSKU.product,
            );
            // insert sku's location into product
            if (selectedSKU.location) {
              product.set('skuLocation', selectedSKU.location.name, {
                strict: false,
              });
            }
            item.set('selectedProduct', product, {
              strict: false,
            });
          }
        }

        workOrder.workOrderItems[i].set('woPickingList', woListing, {
          strict: false,
        });
      }
    }

    return workOrder;
  }

  async findAllWorkOrders(): Promise<WorkOrder[]> {
    const workOrders = await this.workOrderModel
      .find({}, 'woNumber orderId woStatus createdAt, soNumber')
      .exec();

    // await Promise.all(
    //   workOrders.map(async (prop) => {
    //     const salesOrder = await this.salesOrdersService.getSalesOrder(
    //       prop.orderId,
    //     );
    //     // prop.soNumber = salesOrder.soNumber;
    //     prop.set('soNumber', salesOrder.soNumber, {
    //       strict: false,
    //     });
    //   }),
    // );

    return workOrders;
  }

  // Work order filter list
  async getfilters(query: FilterDto): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    // const orderBy = query.orderBy ? query.orderBy : { createdAt: -1 };
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { woNumber: -1 };

    let where = {};
    const namedFilter = [];

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        if (property === 'woStatus') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              namedFilter.push({ woStatus: { $in: propVal } });
            } else {
              namedFilter.push({ woStatus: propVal });
            }
          }
        } else if (property === 'createdAt') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === 0) {
              // if Min field is empty, filter lesser
              namedFilter.push({ createdAt: { $lte: propVal[1] } });
            } else {
              // if Min field is not empty, filter greater and lesser
              namedFilter.push({
                createdAt: { $gte: propVal[0], $lte: propVal[1] },
              });
            }
          } else {
            // if Max field is empty, it is not in Array
            namedFilter.push({ createdAt: { $gte: propVal } });
          }
        }
      }
    }
    if (namedFilter.length == 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { woNumber: searchPattern }, // woNumber
          { soNumber: searchPattern }, // soNumber
        ],
      };
      if (where['$and']) {
        where['$and'].push(searchFilter);
      } else if (Object.keys(where).length > 0) {
        const temp = where;
        where = {};
        where['$and'] = [temp, searchFilter];
      } else {
        where = searchFilter;
      }
    }

    const workOrders = await this.workOrderModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy);

    // await Promise.all(
    //   workOrders.map(async (prop) => {
    //     const salesOrder = await this.salesOrdersService.getSalesOrder(
    //       prop.orderId,
    //     );
    //     if (!salesOrder) {
    //       throw new NotFoundException(
    //         'Some Sales order not found in the workOrder',
    //       );
    //     }
    //     // prop.soNumber = salesOrder.soNumber;
    //     prop.set('soNumber', salesOrder.soNumber, {
    //       strict: false,
    //     });
    //   }),
    // );

    const count = await this.workOrderModel.countDocuments(where);
    return [workOrders, count];
  }

  async removeWorkOrder(id: string) {
    const response = await this.workOrderModel.findByIdAndRemove({ _id: id });
    return response;
  }

  async findWorkOrderBySalesOrderId(salesOrderId: string): Promise<WorkOrder> {
    return await this.workOrderModel.findOne({ orderId: salesOrderId });
  }

  async getWorkOrderByOrderId(orderId: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderModel.findOne({ orderId: orderId });
    return workOrder;
  }

  async getWorkOrderbyId(workOrderId: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderModel.findById(workOrderId);
    return workOrder;
  }

  async updateWorkOrderStatus(id: string, status: any) {
    let newWoStatus: WoStatusEnum = null;

    // From salesOrder is cancelled
    if (status == SalesStatusEnumDto.CANCELLED) {
      newWoStatus = WoStatusEnum.Cancelled;
    }

    return await this.workOrderModel.findOneAndUpdate(
      { orderId: id },
      { woStatus: newWoStatus },
      { new: true },
    );
  }

  async getWorkOrderItemByWoIdAndWoItemId(
    workOrderId: string,
    woItemId: string,
  ): Promise<WorkOrderItems> {
    const workOrder = await this.workOrderModel.findById(workOrderId);

    const workOrderItem = workOrder.workOrderItems.find(
      (item) => item._id.toString() === woItemId.toString(),
    );

    if (!workOrderItem) {
      throw new NotFoundException('Work item not found');
    }
    return workOrderItem;
  }

  async updateDoStatusAndSoStatus(orderId: string) {
    const workOrder = await this.getWorkOrderByOrderId(orderId);

    for (const woItem of workOrder.workOrderItems) {
      const doWoItemsIsClosed = await this.deliveryWorkItemsService.findAllDoWoItemsByWoItemIdAndIsClosed(
        woItem._id,
      );

      if (doWoItemsIsClosed && doWoItemsIsClosed.length > 0) {
        console.log('This Item has partial Delivery Item');
        const initialValue = 0;
        const totalQty = doWoItemsIsClosed.reduce(
          (accumulator, currentValue) => accumulator + currentValue.qty,
          initialValue,
        );

        const balanceQty = woItem.qty - totalQty;

        if (balanceQty === 0) {
          console.log('You are 0, set to completed status');

          woItem.doStatus = WoStatusEnum.Completed;
          await workOrder.save();
        } else {
          // console.log('set Partial on SalesOrder');
          // await this.salesOrdersService.updateDoStatus(
          //   workOrder.orderId,
          //   DeliveryStatusEnum.Partial,
          // );
        }
      }
    }

    if (workOrder) {
      const completedItems = workOrder.workOrderItems.filter(
        (item) => item.doStatus !== DeliveryLineStatusEnum.Completed,
      );

      if (completedItems.length === 0) {
        // Update SalesOrder Status to delivered
        // await this.salesOrdersService.updateStatus(
        //   workOrder.orderId,
        //   SalesStatusEnumDto.DELIVERED,
        // );

        // Update doStatus in salesorder
        await this.salesOrdersService.updateDoStatus(
          workOrder.orderId,
          //DeliveryStatusEnum.Closed,
          soDoStatusEnum.COMPLETE,
        );
      } else if (completedItems.length === workOrder.workOrderItems.length) {
        const doStatus = '';
        await this.salesOrdersService.updateDoStatus(
          workOrder.orderId,
          doStatus,
        );
      }
    }
    return true;
  }

  async generatePdf(id: string): Promise<any> {
    const workOrder = await this.workOrderModel.findById(id);
    console.log('workOrder', workOrder);

    if (!workOrder) {
      throw new NotFoundException('WorkOrder not found');
    }

    const completedDate = moment(workOrder.completedDate).format(
      'Do MMMM YYYY',
    );

    const createdAt = moment(workOrder.createdAt).format('Do MMMM YYYY');

    const saleOrder = await this.salesOrdersService.findByName(workOrder.soNumber);
    let salesPic = "";
    if (saleOrder.salesPic) {
      let salesUser =  await this.userService.findOnePic(saleOrder.salesPic);
      if(salesUser){
        salesPic = salesUser.firstName + " "+ salesUser.lastName;
      }
    }

    // let salesPic: User;
    let numIncrement = 0;
    for (const doItem of workOrder.workOrderItems) {
      numIncrement++;
      const woListing = await this.workOrderPickingsService.findAllWorkOrderPickingsItemByWoItemId(
        doItem._id,
      );
      let PickNumIncrement = 0;
      for (const item of woListing) {
        PickNumIncrement++;
        let woPickingNum = parseFloat(`${numIncrement}.${PickNumIncrement}`);
        if (doItem.workType == 'Pick/Pack' && PickNumIncrement == 1) {
          woPickingNum = numIncrement;
        }

        item.runningNum = woPickingNum;

        if (item.productId) {
          const product = await this.productsService.findOneProductForWO(
            item.productId,
          );
          item.productDesc = product.description;
          item.partNumber = product.partNumber;
        }

        if (item.pickedSkuId) {
          const selectedSKU = await this.skusService.findOneSkuForWO(
            item.pickedSkuId,
          );
          // get product by product id
          const product = await this.productsService.findOneProductForWO(
            selectedSKU.product,
          );

          item.selectedSkuDescription = product.description;
          item.selectedSkuPartNumber = product.partNumber;

          // insert sku's location into product
          if (selectedSKU.location) {
            item.selectedSkuLocation = selectedSKU.location.name;
          }
        }
      }

      doItem.woPickingList = woListing;
    }
    

    const workOrderPayload = {
      woNumber: workOrder.woNumber,
      remark: workOrder.description,
      soNumber: workOrder.soNumber,
      salesPIC: salesPic,
      completedDate: completedDate,
      createAt: createdAt,
      workOrderItems: workOrder.workOrderItems,
    };

    return workOrderPayload;
  }

  async hardResetWorkOrder(salesOrder: SalesOrder) {
    // This is from salesOrder

    const workOrder = await this.workOrderModel.findOne({
      orderId: salesOrder._id,
    });
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    await this.stockOperationService.RemoveAllStockOperationBySoNumber(
      workOrder.soNumber,
      workOrder._id,
    );

    await this.journalEntryService.removeAllJournalEntryBySoNumber(
      salesOrder.soNumber,
    );

    await this.deliveryOrdersService.removeAllDoByWoId(workOrder._id);

    await this.deliveryWorkItemsService.removeAllDoWorkItemsByWoId(
      workOrder._id,
    );

    await this.packingListsService.removeAllPackingListByWoId(workOrder._id);

    await this.workOrderPickingsService.deleteMany(workOrder._id);

    const salesOrderItems = salesOrder.salesOrderItems.filter(
      (item) => item.bom || item.skuId || item.productId,
    );
    salesOrderItems.forEach((item: WorkOrderItems, index: number) => {
      if (item.bom) {
        item.set('workType', 'Assembly', {
          strict: false,
        });
      } else {
        item.set('workType', 'Pick/Pack', {
          strict: false,
        });
      }

      item.set('runningNum', index + 1, {
        strict: false,
      });

      const woItemId = item._id;

      item.set('woItemId', woItemId, {
        strict: false,
      });
    });

    const updatedWorkOrder = await this.workOrderModel.findOneAndUpdate(
      { orderId: salesOrder._id },
      {
        workOrderItems: salesOrderItems,
        woStatus: WoStatusEnum.Open,
        soNumber: salesOrder.soNumber,
      },
      { new: true },
    );

    if (updatedWorkOrder) {
      await this.createWorkOrderPicking(updatedWorkOrder);
      console.log('WorkOrder Reset');

      return salesOrder;
    } else {
      throw new NotFoundException('WorkOrder not found, update denied');
    }
  }

  async updateSimpleByAdmin(
    workOrderId: string,
    updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return await this.workOrderModel.findByIdAndUpdate(
      workOrderId,
      updateWorkOrderDto,
      { new: true },
    );
  }

  // ReCreate WorkOrder From SalesOrder
  async resetWorkOrderOnly(salesOrder: SalesOrder) {
    // This is from salesOrder

    const workOrder = await this.workOrderModel.findOne({
      orderId: salesOrder._id,
    });
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const woPickingLists = await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
      workOrder._id,
    );
    if (woPickingLists && woPickingLists.length > 0) {
      const woPickingNonOpen = woPickingLists.filter(
        (pickingItem) => pickingItem.woPickingStatus !== WoStatusEnum.Open,
      );
      if (woPickingNonOpen && woPickingNonOpen.length > 0) {
        throw new BadRequestException('WorkOrder in Processing, reset denied');
      }
    }

    const salesOrderItems = salesOrder.salesOrderItems.filter(
      (item) => item.bom || item.skuId || item.productId,
    );
    salesOrderItems.forEach((item: WorkOrderItems, index: number) => {
      if (item.bom) {
        item.set('workType', 'Assembly', {
          strict: false,
        });
      } else {
        item.set('workType', 'Pick/Pack', {
          strict: false,
        });
      }

      item.set('runningNum', index + 1, {
        strict: false,
      });

      const woItemId = item._id;

      item.set('woItemId', woItemId, {
        strict: false,
      });
    });

    const updatedWorkOrder = await this.workOrderModel.findOneAndUpdate(
      { orderId: salesOrder._id },
      {
        workOrderItems: salesOrderItems,
        woStatus: WoStatusEnum.Open,
        soNumber: salesOrder.soNumber,
      },
      { new: true },
    );

    if (updatedWorkOrder) {
      await this.workOrderPickingsService.deleteMany(workOrder._id);

      await this.createWorkOrderPicking(updatedWorkOrder);
      console.log('WorkOrder Reset');

      return salesOrder;
    } else {
      throw new NotFoundException('WorkOrder not found, update denied');
    }
  }

  async onUnPickedSkuIfSkuShortFall(catchRsvd: RsvdDto[]) {
    const uniqueRsvd: RsvdDto[] = catchRsvd.reduce((accumulator, current) => {
      if (
        !accumulator.some((rsvd) => String(rsvd._id) === String(current._id))
      ) {
        accumulator.push(current);
      }
      return accumulator;
    }, []);

    console.log('Catched RSVD', uniqueRsvd);

    if (uniqueRsvd && uniqueRsvd.length > 0) {
      for (const rsvd of uniqueRsvd) {
        const skuData = await this.skusService.findOneSkuOnly(rsvd.skuId);
        // console.log('skuData', skuData);
        // console.log('rsvd.woItemId,', rsvd.woItemId);
        if (skuData) {
          console.log('skuData._id,', skuData.id);
          const woPickingListPickedSku = await this.workOrderPickingsService.findAllWorkOrderPickingByWorkItemIdAndPickedSku(
            rsvd.woItemId,
            skuData.id,
          );
          console.log(
            'what to woPickingListPickedSku to restore',
            woPickingListPickedSku,
          );
          if (woPickingListPickedSku && woPickingListPickedSku.length > 0) {
            for (const woPickingItem of woPickingListPickedSku) {
              woPickingItem.pickedSkuId = undefined;
              woPickingItem.checkConfirmWoItem = false;
              woPickingItem.woPickingStatus = WoPickingStatusEnum.Open;
              await woPickingItem.save();
            }

            const response = await this.onRemoveSKUReserveIfUnsufficientQty(
              skuData,
              rsvd.woId,
              rsvd.woItemId,
            );

            console.log('SKU after restored', response);
          } else {
            console.log('work picking item not found');
            throw new NotFoundException('Work picking item not found');
          }
        } else {
          console.log('Sku Not found');
          throw new NotFoundException('SKU not found in Rsvd');
        }
      }
    }
  }

  async onCancelSKUReserveFromReset(sku: Sku, woId: string) {
    if (sku && sku.rsvd) {
      // console.log(`OnRemoveSkuReserved SkuId ${sku}`);
      // console.log('Sku.rsvd', sku.rsvd);

      function search(item: { [x: string]: any }) {
        return Object.keys(this).some((key) => item[key] !== this[key]);
      }

      const query = {
        woId: String(woId),
      };

      const skuReserveRemoved = sku.rsvd.filter(search, query);
      // console.log('Sku.rsvd after removed', skuReserveRemoved);
      sku.rsvd = skuReserveRemoved;
      await sku.save();
    }
  }

  // All reserved become unreserved and removed splitted array items
  async lightResetWorkOrder(workOrderId: string) {
    const workOrder = await this.getWorkOrderbyId(workOrderId);

    if (!workOrder) {
      throw new NotFoundException('WorkOrder not found, reset aborted');
    }

    const worPickingsByWoId = await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
      workOrderId,
    );

    const nonCompletedWoPickingItems = worPickingsByWoId.filter(
      (item) => item.woPickingStatus !== WoPickingStatusEnum.Completed,
    );

    const uniqueWoPickingItemsByWorkItems = nonCompletedWoPickingItems.reduce(
      (accumulator, current) => {
        if (
          !accumulator.some(
            (woPickingItem) =>
              String(woPickingItem.woItemId) === String(current.woItemId),
          )
        ) {
          accumulator.push(current);
        }
        return accumulator;
      },
      [],
    );

    const catchWoPickingPayload = [];
    for (const uniqueWoPickItem of uniqueWoPickingItemsByWorkItems) {
      const woPickingItemfilteredByWoItems = nonCompletedWoPickingItems.filter(
        (item) => String(item.woItemId) === String(uniqueWoPickItem.woItemId),
      );

      const woPickingItemsgroupByProductId = woPickingItemfilteredByWoItems.reduce(
        (accumulator, current) => {
          if (
            !accumulator.some(
              (woPickingItem) =>
                String(woPickingItem.productId) === String(current.productId),
            )
          ) {
            accumulator.push(current);
          }
          return accumulator;
        },
        [],
      );
      console.log(
        'woPickingItemfilteredByWoItems',
        woPickingItemfilteredByWoItems,
      );
      console.log(
        'woPickingItemsgroupByProductId',
        woPickingItemsgroupByProductId,
      );

      for (const item of woPickingItemsgroupByProductId) {
        let accumulate = 0;
        for (const filteredItem of woPickingItemfilteredByWoItems) {
          if (String(item.productId) === String(filteredItem.productId)) {
            accumulate += filteredItem.workQty;
          }
        }

        item.workQty = accumulate;
        catchWoPickingPayload.push(item);
      }
    }

    // ON Cancel Reserved Quantity
    const triggerBy = 'onReset';
    const woItemId = undefined;
    await this.onCancelSkuReserve(woItemId, workOrder, triggerBy);

    // ON Remove WorkPicking
    await this.workOrderPickingsService.deleteManyNonCompletedItemByWoIdAndWoPickingStatus(
      workOrderId,
      WoPickingStatusEnum.Completed,
    );

    console.log('catchWoPickingPayload', catchWoPickingPayload);

    // ON Create new WorkPicking
    for (const payload of catchWoPickingPayload) {
      payload.woPickingStatus = WoPickingStatusEnum.Open;
      payload.pickedSkuId = undefined;
      await this.workOrderPickingsService.updateOneWoPickingByIdFromReset(
        payload._id,
        payload,
      );
    }

    return await this.findOneWorkOrder(workOrderId);
  }

  async mediumResetWorkItems(
    workOrderId: string,
    resetWorkItemsDto: OnResetWoItemDto,
  ) {
    const workOrder = await this.getWorkOrderbyId(workOrderId);
    if (!workOrder) {
      throw new NotFoundException('Work Order Not Found, reset aborted');
    }

    if (
      resetWorkItemsDto.workOrderItems &&
      resetWorkItemsDto.workOrderItems.length < 1
    ) {
      throw new NotFoundException('WorkOrderItems not found from user input');
    }

    let canProceed = true;

    const catchStockOperationIds = [];
    const catchStockMoveIds = [];
    const catchSkus = [];

    // CHECK OPERATION & JOUNRAL ENTRIES
    for (const woItemDto of resetWorkItemsDto.workOrderItems) {
      const woPickingByWoItems = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemId(
        woItemDto._id,
      );
      if (woPickingByWoItems && woPickingByWoItems.length > 0) {
        const completedPickItems = woPickingByWoItems.filter(
          (item) => item.woPickingStatus === WoPickingStatusEnum.Completed,
        );
        // console.log('completedPickItems', completedPickItems);
        // check this length thing
        if (completedPickItems.length > 0) {
          for (const completedPickItem of completedPickItems) {
            const stockMove = await this.stockMoveService.findByLineNumberId(
              completedPickItem._id,
            );
            if (!stockMove) {
              throw new NotFoundException(
                'Stock move not found due to old workorder, reset aborted',
              );
            }
            catchStockMoveIds.push(stockMove._id);
            catchStockOperationIds.push(stockMove.operationId);

            const sku = await this.skusService.findOneSkuOnly(stockMove.skuId);
            if (sku) {
              const skuPayload = {
                skuId: sku._id,
                quantity: stockMove.completedQty,
              };
              catchSkus.push(skuPayload);
              // sku.quantity += stockMove.completedQty;
              // await sku.save();
            } else {
              throw new BadRequestException('Sku not found, reset ops aborted');
            }
          }
        } else {
          throw new BadRequestException(
            'Some lines has no completed Items, reset aborted',
          );
        }
      } else {
        // very rare
        throw new NotFoundException('WorkPicking not found');
      }
    }

    // await this.checkAvailJounalEntry(catchStockOperationIds);

    const deliveryOrders = await this.deliveryOrdersService.findAllDeliverOrderByWoId(
      workOrderId,
    );
    // FIND DELIVERY ORDERS
    let uniqueCatch = [];
    if (deliveryOrders && deliveryOrders.length > 0) {
      // This telling users which Delivery Order to remove

      const catchDeliveryOrders = [];
      for (const woItemDto of resetWorkItemsDto.workOrderItems) {
        if (woItemDto.bom) {
          for (const deliveryOrder of deliveryOrders) {
            for (const doItem of deliveryOrder.deliveryLines) {
              if (
                String(woItemDto.woItemId) === String(doItem.woItemId) &&
                String(woItemDto.productId) === String(doItem.productId)
              ) {
                catchDeliveryOrders.push(deliveryOrder.deliveryNumber);
              }
            }
          }
        } else {
          const woPickingByWoItems = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemId(
            woItemDto._id,
          );
          if (woPickingByWoItems && woPickingByWoItems.length > 0) {
            for (const woPickingItem of woPickingByWoItems) {
              for (const deliveryOrder of deliveryOrders) {
                for (const doItem of deliveryOrder.deliveryLines) {
                  if (
                    String(woPickingItem.woItemId) ===
                      String(doItem.woItemId) &&
                    String(woPickingItem.productId) === String(doItem.productId)
                  ) {
                    catchDeliveryOrders.push(deliveryOrder.deliveryNumber);
                  }
                }
              }
            }
          } else {
            // very rare
            throw new NotFoundException('WorkPicking not found');
          }
        }
      }

      if (catchDeliveryOrders.length > 0) {
        // console.log('catchDeliveryOrders', catchDeliveryOrders);
        uniqueCatch = catchDeliveryOrders.filter(
          (item, index, arr) => arr.indexOf(item) == index,
        );

        canProceed = false;
        throw new BadRequestException(
          `DO Num: ${uniqueCatch} required deletion before proceed reset`,
        );
      }
    }

    if (canProceed) {
      console.log('Can proceed');
      console.log('catchStockOperationIds', catchStockOperationIds);
      await this.stockOperationService.removeSelectedStockOperationById(
        catchStockOperationIds,
        catchStockMoveIds,
      );

      await this.onRestoreSkuQty(catchSkus);

      // Restore workpicking====================================>
      for (const woItemDto of resetWorkItemsDto.workOrderItems) {
        const woPickingByWoItems = await this.workOrderPickingsService.findAllWorkOrderPickingByWoItemId(
          woItemDto._id,
        );
        const completedWoPickingItems = woPickingByWoItems.filter(
          (item) => item.woPickingStatus === WoPickingStatusEnum.Completed,
        );

        for (const woPickItem of completedWoPickingItems) {
          woPickItem.checkConfirmWoItem = false;
          woPickItem.partialCount = null;
          woPickItem.bomQtyInput = null;
          woPickItem.woPickingStatus = WoPickingStatusEnum.Open;
          woPickItem.pickedSkuId = null;

          // const woPickingPayload: UpdateOneWoPickingDto = {
          //   checkConfirmWoItem: false,
          //   partialCount: undefined,
          //   bomQtyInput: undefined,
          //   woPickingStatus: WoPickingStatusEnum.Open,
          //   pickedSkuId: undefined,
          // };
          await this.workOrderPickingsService.updateOneWoPickingById(
            woPickItem._id,
            woPickItem,
          );
        }
        await this.workOrderModel.updateOne(
          {
            _id: workOrder._id,
            'workOrderItems._id': woItemDto._id,
          },
          {
            $set: {
              'workOrderItems.$.woItemStatus': WoStatusEnum.Open,
              'workOrderItems.$.confirmQty': 0,
              'workOrderItems.$.latestQtyInput': 0,
            },
            $unset: {
              'workOrderItems.$.completedBy': '',
              'workOrderItems.$.completedDate': '',
              'workOrderItems.$.doStatus': '',
            },
          },
        );
      }
      // Update status if any
      await this.updateWorkOrderStatusAndSoStatus(workOrder);

      // Update DoStatus on SalesOrder

      const woDoItems = await this.deliveryWorkItemsService.findAllByWoId(
        workOrder._id,
      );
      if (woDoItems && woDoItems.length < 1) {
        const doStatus = '';
        await this.salesOrdersService.updateDoStatus(
          workOrder.orderId,
          doStatus,
        );
      }
    }
    console.log('The End');
    return this.findOneWorkOrder(workOrder._id);
  }

  // Temporary no use
  async checkAvailJounalEntry(stockOperationIds): Promise<any> {
    const uniStockOpIds = stockOperationIds.filter(
      (operationIds, index, array) =>
        array.indexOf(operationIds) === index ? operationIds : '',
    );

    if (uniStockOpIds.length > 0) {
      for (const operationId of uniStockOpIds) {
        const journalEntries = await this.journalEntryService.findOneWithModelId(
          operationId,
        );
        if (!journalEntries) {
          // This may happen
          throw new NotFoundException(
            'Journal Entries not found due to old workOrder, reset aborted',
          );
        }
        return true;
      }
    }
  }

  async onRestoreSkuQty(catchSkus: any[]): Promise<any> {
    const uniqueSkuIds = [
      ...new Set(catchSkus.map((data) => String(data.skuId))),
    ];

    for (const skuId of uniqueSkuIds) {
      const skuGrouped = catchSkus.filter((item) => {
        if (String(item.skuId) === String(skuId)) {
          return uniqueSkuIds;
        }
      });

      let sumUpQty = 0;
      for (const sku of skuGrouped) {
        sumUpQty += sku.quantity;
      }

      const skuDB = await this.skusService.findOneSkuOnly(String(skuId));
      if (skuDB) {
        skuDB.quantity += sumUpQty;
        await skuDB.save();
      } else {
        throw new BadRequestException('Sku not found, reset ops aborted');
      }
      console.log('sum', sumUpQty);
    }
  }

  async updateDoStatusWoItemAfterMediumReset(workOrderId: string) {
    const workOrder = await this.getWorkOrderbyId(workOrderId);
    console.log('updateDoStatusWoItemAfterMediumReset');
    for (const woItem of workOrder.workOrderItems) {
      const doWoItemsIsClosed = await this.deliveryWorkItemsService.findAllDoWoItemsByWoItemIdAndIsClosed(
        woItem._id,
      );
      if (doWoItemsIsClosed && doWoItemsIsClosed.length > 0) {
        console.log('doWoItemsIsClosed', doWoItemsIsClosed);
        const initialValue = 0;
        const totalQty = doWoItemsIsClosed.reduce(
          (accumulator, currentValue) => accumulator + currentValue.qty,
          initialValue,
        );

        const balanceQty = woItem.qty - totalQty;

        if (balanceQty !== 0) {
          woItem.doStatus = undefined;
        }
      } else {
        woItem.doStatus = undefined;
      }
    }

    const woDoItems = await this.deliveryWorkItemsService.findAllByWoId(
      workOrder._id,
    );
    if (woDoItems && woDoItems.length < 1) {
      const doStatus = '';
      await this.salesOrdersService.updateDoStatus(workOrder.orderId, doStatus);
    } else {
      const doStatus = soDoStatusEnum.PARTIAL;
      await this.salesOrdersService.updateDoStatus(workOrder.orderId, doStatus);
    }

    return await workOrder.save();
  }
}
