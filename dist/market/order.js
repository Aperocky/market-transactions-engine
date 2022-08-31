"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const uuid_1 = require("uuid");
class Order {
    constructor(resourceName, orderType, unitPrice, quantity) {
        this.orderId = (0, uuid_1.v4)();
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
exports.Order = Order;
