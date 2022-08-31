export interface IOrder {
    orderId: string;
    resourceName: string;
    orderType: boolean;
    unitPrice: number;
    quantity: number;
    delivered: boolean;
    settlePrice?: number;
    quantityFulfilled?: number;
    deliver: () => void;
    settle: (settlePrice: number, quantityFulfilled: number) => void;
    getIncome: () => number;
}
export declare class Order implements IOrder {
    orderId: string;
    resourceName: string;
    orderType: boolean;
    unitPrice: number;
    quantity: number;
    delivered: boolean;
    settlePrice?: number;
    quantityFulfilled?: number;
    constructor(resourceName: string, orderType: boolean, unitPrice: number, quantity: number);
    deliver(): void;
    settle(settlePrice: any, quantityFulfilled: any): void;
    getIncome(): number;
}
