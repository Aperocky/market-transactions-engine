"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketTransactionsEngine = void 0;
class MarketTransactionsEngine {
    constructor() {
        this.orders = new Map();
        this.ordersByResource = new Map();
        this.data = new Map();
    }
    addOrders(orders) {
        for (const order of orders) {
            let resourceName = order.resourceName;
            this.orders.set(order.orderId, order);
            if (this.ordersByResource.has(resourceName)) {
                this.ordersByResource.get(resourceName).push(order);
            }
            else {
                this.ordersByResource.set(resourceName, [order]);
            }
        }
    }
    processOrders() {
        for (const [resourceName, resourceOrders] of this.ordersByResource) {
            let resourceMarketData = this.processResourceOrder(resourceOrders);
            console.log(resourceMarketData);
            this.data.set(resourceName, resourceMarketData);
        }
        return this.orders;
    }
    getData() {
        return this.data;
    }
    resetMarket(keepUnfilledOrders) {
        this.data = new Map();
        if (keepUnfilledOrders) {
            for (const [resource, orders] of this.ordersByResource) {
                let fulfilledOrders = orders.filter(order => order.delivered);
                for (const order of fulfilledOrders) {
                    this.orders.delete(order.orderId);
                }
                let unfilledOrders = orders.filter(order => !order.delivered);
                if (unfilledOrders.length == 0) {
                    this.ordersByResource.delete(resource);
                }
                else {
                    this.ordersByResource.set(resource, unfilledOrders);
                }
            }
        }
        else {
            this.orders = new Map();
            this.ordersByResource = new Map();
        }
    }
    // Process the orders for a particular resource
    processResourceOrder(orders) {
        let sellOrdersCount = 0;
        let buyOrdersCount = 0;
        let sellOrdersVolume = 0;
        let buyOrdersVolume = 0;
        let buyOrders = [];
        let sellOrders = [];
        for (const order of orders) {
            if (order.orderType) {
                buyOrders.push(order);
                buyOrdersCount++;
                buyOrdersVolume += order.quantity;
            }
            else {
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
        let currentSellOrder = sellOrders.pop();
        let currentBuyOrder = buyOrders.pop();
        let currentSellPrice = currentSellOrder.unitPrice;
        let currentBuyPrice = currentBuyOrder.unitPrice;
        let currentSoldQuantity = 0;
        let currentBoughtQuantity = 0;
        let soldOrders = [];
        let boughtOrders = [];
        let finalPrice = 0;
        while (true) {
            if (currentSellPrice > currentBuyPrice) {
                if (currentBuyOrder != null) {
                    finalPrice = currentSellPrice;
                }
                else {
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
            }
            else {
                if (sellOrders.length == 0) {
                    finalPrice = currentBuyPrice;
                    break;
                }
                currentSellOrder = sellOrders.pop();
                currentSellPrice = currentSellOrder.unitPrice;
            }
        }
        // Handle delivered orders, starting with partial delivery
        let partialOrder;
        let soldOrderCount = soldOrders.length;
        let boughtOrderCount = boughtOrders.length;
        if (currentSoldQuantity > currentBoughtQuantity) {
            partialOrder = soldOrders.pop();
        }
        else if (currentSoldQuantity < currentBoughtQuantity) {
            partialOrder = boughtOrders.pop();
        }
        if (partialOrder != null) {
            let lostVolume = Math.abs(currentSoldQuantity - currentBoughtQuantity);
            partialOrder.settle(finalPrice, partialOrder.quantity - lostVolume);
        }
        let settleAll = (orders) => {
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
exports.MarketTransactionsEngine = MarketTransactionsEngine;
