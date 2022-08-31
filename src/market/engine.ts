import { IOrder } from './order';


export type MarketDataForResource = {
    sellOrdersCount: number;
    buyOrdersCount: number;
    sellOrdersVolume: number;
    buyOrdersVolume: number;
    sellOrdersDelivered: number;
    buyOrdersDelivered: number;
    actualVolume: number;
    actualPrice: number;
}


export interface IMarketTransactionsEngine {

    // Adding or removing orders to/from market
    addOrders: (orders: IOrder[]) => void;
    removeOrders: (orders: IOrder[]) => void;
    getOrders: () => Map<string, IOrder>;
    // Updates the order in place, deliver the order if filled.
    processOrders: () => void;
    // Get metadata about the market
    getData: () => Map<string, MarketDataForResource>;
    // Reset All Orders, optionally keep unfilled orders
    resetMarket: (keepUnfilledOrders: boolean) => void;
}


export class MarketTransactionsEngine implements IMarketTransactionsEngine {

    orders: Map<string, IOrder>;
    data: Map<string, MarketDataForResource>;

    constructor() {
        this.orders = new Map();
        this.data = new Map();
    }

    addOrders(orders: IOrder[]): void {
        for (const order of orders) {
            this.orders.set(order.orderId, order);
        }
    }

    removeOrders(orders: IOrder[]): void {
        for (const order of orders) {
            this.orders.delete(order.orderId);
        }
    }

    getOrders(): Map<string, IOrder> {
        return this.orders;
    }

    processOrders(): void {
        let ordersByResource: Map<string, IOrder[]> = new Map();
        for (const order of this.orders.values()) {
            let resourceName = order.resourceName;
            if (ordersByResource.has(resourceName)) {
                ordersByResource.get(resourceName).push(order);
            } else {
                ordersByResource.set(resourceName, [order]);
            }
        }
        for (const [resourceName, resourceOrders] of ordersByResource) {
            let resourceMarketData = this.processResourceOrder(resourceOrders);
            this.data.set(resourceName, resourceMarketData);
        }
    }

    getData(): Map<string, MarketDataForResource> {
        return this.data;
    }

    resetMarket(keepUnfilledOrders: boolean = false): void {
        this.data = new Map();
        if (keepUnfilledOrders) {
            let filledOrders = [];
            for (const order of this.orders.values()) {
                if (order.delivered) {
                    filledOrders.push(order);
                }
            }
            this.removeOrders(filledOrders);
        } else {
            this.orders = new Map();
        }
    }

    // Process the orders for a particular resource
    processResourceOrder(orders: IOrder[]): MarketDataForResource {
        let sellOrdersCount = 0;
        let buyOrdersCount = 0;
        let sellOrdersVolume = 0;
        let buyOrdersVolume = 0;

        let buyOrders: IOrder[] = [];
        let sellOrders: IOrder[] = [];
        for (const order of orders) {
            if (order.orderType) {
                buyOrders.push(order);
                buyOrdersCount++;
                buyOrdersVolume += order.quantity;
            } else {
                sellOrders.push(order);
                sellOrdersCount++;
                sellOrdersVolume += order.quantity;
            }
        }

        // buy order by unitPrice, cheap -> expensive
        // sell order by unitPrice, expensive -> cheap
        buyOrders.sort((a, b) => a.unitPrice - b.unitPrice);
        sellOrders.sort((a, b) => b.unitPrice - a.unitPrice);

        if (buyOrders.length == 0 || sellOrders.length == 0) {
            return {
                sellOrdersCount: sellOrdersCount,
                buyOrdersCount: buyOrdersCount,
                sellOrdersVolume: sellOrdersVolume,
                buyOrdersVolume: buyOrdersVolume,
                sellOrdersDelivered: 0,
                buyOrdersDelivered: 0,
                actualVolume: 0,
                actualPrice: 0,
            };
        }

        // Main loop
        let currentSellOrder: IOrder | null = sellOrders.pop();
        let currentBuyOrder: IOrder | null = buyOrders.pop();
        let currentSellPrice = currentSellOrder.unitPrice;
        let currentBuyPrice = currentBuyOrder.unitPrice;
        let currentSoldQuantity = 0;
        let currentBoughtQuantity = 0;
        let soldOrders: IOrder[] = [];
        let boughtOrders: IOrder[] = [];
        let finalPrice = 0;

        while (true) {
            if (currentSellPrice > currentBuyPrice) {
                if (currentBuyOrder != null) {
                    finalPrice = currentSellPrice;
                } else {
                    finalPrice = currentBuyPrice;
                }
                break;
            }
            // Commit current orders
            if (currentBuyOrder != null) {
                currentBuyOrder.deliver();
                currentBoughtQuantity += currentBuyOrder.quantity;
                boughtOrders.push(currentBuyOrder);
                currentBuyOrder = null;
            }
            if (currentSellOrder != null) {
                currentSellOrder.deliver();
                currentSoldQuantity += currentSellOrder.quantity;
                soldOrders.push(currentSellOrder);
                currentSellOrder = null;
            }
            // Get next order
            if (currentSoldQuantity > currentBoughtQuantity) {
                if (buyOrders.length == 0) {
                    finalPrice = currentSellPrice;
                    break;
                }
                currentBuyOrder = buyOrders.pop();
                currentBuyPrice = currentBuyOrder.unitPrice;
            } else {
                if (sellOrders.length == 0) {
                    finalPrice = currentBuyPrice;
                    break;
                }
                currentSellOrder = sellOrders.pop();
                currentSellPrice = currentSellOrder.unitPrice;
            }
        }

        // Handle delivered orders, starting with partial delivery
        let partialOrder: IOrder;
        let soldOrderCount = soldOrders.length;
        let boughtOrderCount = boughtOrders.length;
        if (currentSoldQuantity > currentBoughtQuantity) {
            partialOrder = soldOrders.pop();
        } else if (currentSoldQuantity < currentBoughtQuantity) {
            partialOrder = boughtOrders.pop();
        }
        if (partialOrder != null) {
            let lostVolume = Math.abs(currentSoldQuantity - currentBoughtQuantity);
            partialOrder.settle(finalPrice, partialOrder.quantity - lostVolume);
        }
        let settleAll = (orders: IOrder[]) => {
            for (const order of orders) {
                order.settle(finalPrice, order.quantity);
            }
        };
        settleAll(soldOrders);
        settleAll(boughtOrders);

        return {
            sellOrdersCount: sellOrdersCount,
            buyOrdersCount: buyOrdersCount,
            sellOrdersVolume: sellOrdersVolume,
            buyOrdersVolume: buyOrdersVolume,
            sellOrdersDelivered: soldOrderCount,
            buyOrdersDelivered: boughtOrderCount,
            actualVolume: Math.min(currentSoldQuantity, currentBoughtQuantity),
            actualPrice: finalPrice,
        };
    }
}
