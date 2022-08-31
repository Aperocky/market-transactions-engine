import { IOrder, Order } from '../src/index';
import { assert, expect } from 'chai';
import { validate } from 'uuid';


describe("Order", () => {
    it("Test orders creation", () => {
        let order = new Order("Rice", true, 1, 1);
        assert(validate(order.orderId));
    });

    it("Test getIncome", () => {
        let order = new Order("Rice", true, 1, 1);
        expect(order.getIncome()).to.equal(0);
        order.deliver();
        order.settle(0.5, 1);
        expect(order.getIncome()).to.equal(-0.5);
    });
});


