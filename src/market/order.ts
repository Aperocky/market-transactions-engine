import { v4 as uuid } from 'uuid';


export interface IOrder {
    orderId: string; // unique identifier
    resourceName: string; // resource being traded
    orderType: boolean; // buy or sell. buy=true, sell=false

    // unit price:
    // for buy orders, the unitPrice represent the highest price payable
    // for sell orders, the unitPrice represent the lowest price accepted
    unitPrice: number;
    quantity: number;
    delivered: boolean; // false means the order is currently unfilled.

    settlePrice?: number; // actual settle price, if delivered.
    quantityFulfilled?: number; // quantityFulfilled can be lower than actual quantity.

    deliver: () => void;
    settle: (settlePrice: number, quantityFulfilled: number) => void;
    getIncome: () => number;
}


export class Order implements IOrder {

    orderId: string;
    resourceName: string;
    orderType: boolean;
    unitPrice: number;
    quantity: number;
    delivered: boolean;
    settlePrice?: number;
    quantityFulfilled?: number;

    constructor(
        resourceName: string,
        orderType: boolean,
        unitPrice: number,
        quantity: number
    ) {
        this.orderId = uuid();
        this.resourceName = resourceName;
        this.orderType = orderType;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.delivered = false;
    }

    deliver() {
        this.delivered = true;
    }

    settle(settlePrice, quantityFulfilled) {
        if (!this.delivered) {
            throw new Error("Cannot settle an order that isn't delivered");
        }
        this.settlePrice = settlePrice;
        this.quantityFulfilled = quantityFulfilled;
    }

    getIncome() {
        if (this.delivered) {
            let fullPrice = this.settlePrice * this.quantityFulfilled;
            return this.orderType ? -fullPrice : fullPrice;
        }
        return 0;
    }
}
