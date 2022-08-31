import { IOrder, Order } from '../src/index';
import { IMarketTransactionsEngine, MarketTransactionsEngine } from '../src/index';
import { assert, expect } from 'chai';


describe("MarketTransactionEngine", () => {

    it("Test basic populate order", () => {
        let engine = new MarketTransactionsEngine();
        let order1 = new Order("Rice", true, 1, 1);
        let order2 = new Order("Rice", false, 1, 1);
        let order3 = new Order("Bread", true, 1, 1);
        engine.addOrders([order1, order2]);
        assert(engine.orders.has(order1.orderId));
        assert(engine.orders.has(order2.orderId));
        assert(engine.ordersByResource.has("Rice"));
        expect(engine.ordersByResource.size).to.equal(1);
        expect(engine.ordersByResource.get("Rice").length).to.equal(2);
        engine.addOrders([order3]);
        expect(engine.ordersByResource.size).to.equal(2);
        expect(engine.ordersByResource.get("Bread").length).to.equal(1);
    });

    it("Test simplest happy case for market", () => {
        let engine = new MarketTransactionsEngine();
        let order1 = new Order("Rice", true, 1, 1);
        let order2 = new Order("Rice", false, 1, 1);
        engine.addOrders([order1, order2]);
        let results = engine.processOrders();
        let checkState = (order) => {
            assert(order.delivered);
            expect(order.quantityFulfilled).to.equal(1);
            expect(order.settlePrice).to.equal(1);
        };
        checkState(order1);
        checkState(order2);
        for (const [id, order] of results) {
            checkState(order);
        }
    });

    it("Test basic partial order fulfill case", () => {
        let engine = new MarketTransactionsEngine();
        let order1 = new Order("Rice", true, 1, 1);
        let order2 = new Order("Rice", false, 1, 1.5);
        engine.addOrders([order1, order2]);
        let results = engine.processOrders();
        let checkState = (order) => {
            assert(order.delivered);
            expect(order.quantityFulfilled).to.equal(1);
            expect(order.settlePrice).to.equal(1);
        };
        checkState(order1);
        checkState(order2);
        for (const [id, order] of results) {
            checkState(order);
        }
        expect(order1.getIncome()).to.equal(-1);
    });

    it("Test basic case for pricing and reporting", () => {
        let engine = new MarketTransactionsEngine();
        let order1 = new Order("Rice", true, 1.2, 1);
        let order2 = new Order("Rice", true, 1.1, 1);
        let order3 = new Order("Rice", false, 1, 1.5);
        engine.addOrders([order1, order2, order3]);
        let results = engine.processOrders();
        for (const [id, order] of results) {
            assert(order.delivered);
            expect(order.settlePrice).to.equal(1.1);
        }
        expect(order2.quantityFulfilled).to.equal(0.5);
        let riceReport = engine.getData().get("Rice");
        expect(riceReport["sellOrdersCount"]).to.equal(1);
        expect(riceReport["buyOrdersCount"]).to.equal(2);
        expect(riceReport["sellOrdersVolume"]).to.equal(1.5);
        expect(riceReport["buyOrdersVolume"]).to.equal(2);
        expect(riceReport["sellOrdersDelivered"]).to.equal(1);
        expect(riceReport["buyOrdersDelivered"]).to.equal(2);
        expect(riceReport["actualPrice"]).to.equal(1.1);
        expect(riceReport["actualVolume"]).to.equal(1.5);
    });

    it("Test one giant vendor with many small buyers", () => {
        let engine = new MarketTransactionsEngine();
        let sellOrder = new Order("Rice", false, 1, 100);
        let buyOrders = [];
        let randomBuyOrders = () => {
            return new Order("Rice", true, Math.random() + 0.5, Math.random() + 1);
        };
        for (let i = 0; i < 50; i++) {
            buyOrders.push(randomBuyOrders());
        }
        engine.addOrders(buyOrders);
        engine.addOrders([sellOrder])
        let results = engine.processOrders();
        let riceReport = engine.getData().get("Rice");
        expect(riceReport["actualPrice"]).to.equal(1);
        let sumVolume = 0;
        for (const order of buyOrders) {
            if (order.unitPrice >= 1) {
                assert(order.delivered);
                expect(order.quantity).to.equal(order.quantityFulfilled);
                sumVolume += order.quantity;
            } else {
                assert(!order.delivered);
            }
        }
        assert(sellOrder.delivered);
        expect(sellOrder.quantityFulfilled).to.be.closeTo(sumVolume, 0.00001);
        expect(riceReport["actualVolume"]).to.be.closeTo(sumVolume, 0.00001);
    });

    it("Test flea market", () => {
        let engine = new MarketTransactionsEngine();
        let randomOrders = () => {
            return new Order("Stuff", Math.random() > 0.5 ? true : false, Math.random(), Math.random());
        };
        let orders = [];
        for (let i = 0; i < 50; i++) {
            orders.push(randomOrders());
        }
        engine.addOrders(orders);
        let results = engine.processOrders();
        let stuffGain = 0;
        let moneyGain = 0;
        for (const order of orders) {
            if (order.delivered) {
                if (order.orderType) {
                    stuffGain += order.quantityFulfilled;
                } else {
                    stuffGain -= order.quantityFulfilled;
                }
                moneyGain += order.getIncome();
            }
        }
        expect(stuffGain).to.be.closeTo(0, 0.00001);
        expect(moneyGain).to.be.closeTo(0, 0.00001);
    });
});
