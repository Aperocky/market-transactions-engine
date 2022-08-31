import { IOrder } from './order';
export declare type MarketDataForResource = {
    sellOrdersCount: number;
    buyOrdersCount: number;
    sellOrdersVolume: number;
    buyOrdersVolume: number;
    sellOrdersDelivered: number;
    buyOrdersDelivered: number;
    actualVolume: number;
    actualPrice: number;
};
export interface IMarketTransactionsEngine {
    addOrders: (orders: IOrder[]) => void;
    processOrders: () => Map<string, IOrder>;
    getData: () => Map<string, MarketDataForResource>;
    resetMarket: (keepUnfilledOrders: boolean) => void;
}
export declare class MarketTransactionsEngine implements IMarketTransactionsEngine {
    orders: Map<string, IOrder>;
    ordersByResource: Map<string, IOrder[]>;
    data: Map<string, MarketDataForResource>;
    constructor();
    addOrders(orders: IOrder[]): void;
    processOrders(): Map<string, IOrder>;
    getData(): Map<string, MarketDataForResource>;
    resetMarket(keepUnfilledOrders: any): void;
    processResourceOrder(orders: IOrder[]): MarketDataForResource;
}
