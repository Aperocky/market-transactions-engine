import { IOrder, Order } from '../src/index';
import { assert } from 'chai';
import { validate } from 'uuid';


describe("Order", () => {
    it("Test orders creation", () => {
        let order = new Order("Rice", true, 1, 1);
        assert(validate(order.orderId));
    });
});


