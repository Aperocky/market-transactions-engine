## Market Transactions Engine.

A market engine to determine price and fulfill orders based on supply and demands.

### How it works

The market is simulated by discrete `Order`s, which takes this form:

    interface Order {
        orderId: string;
        resourceName: string;
        orderType: boolean; // buy or sell. buy=true, sell=false
        unitPrice: number;
        // for buy orders, the unitPrice represent the highest price payable
        // for sell orders, the unitPrice represent the lowest price accepted
        quantity: number;
        delivered: boolean;
        settlePrice?: number;
        quantityFulfilled?: number;
    }

Market engine takes a list of above orders, and process them at once, filling the orders with the highest buy price and lowest sell price until the prices meet. Orders are then delivered, with settlePrice and quantityFulfilled parameter in terms of an half filled order.

A very quick example:

    let engine = new MarketTransactionsEngine();
    let order1 = new Order("Rice", true, 1.2, 1); // resource name, buy/sell, unit price, quantity
    let order2 = new Order("Rice", true, 1.1, 1);
    let order3 = new Order("Rice", false, 1, 1.5);
    engine.addOrders([order1, order2, order3]);
    engine.processOrders();
    let riceReport = engine.getData().get("Rice");
    // Rice Report:
    {
      sellOrdersCount: 1,
      buyOrdersCount: 2,
      sellOrdersVolume: 1.5,
      buyOrdersVolume: 2,
      sellOrdersDelivered: 1,
      buyOrdersDelivered: 2,
      actualVolume: 1.5,
      actualPrice: 1.1
    }

    // order2 is updated in this process and is half filled per market:
    Order {
      orderId: '25a3877a-fdf1-487c-b2c2-1fb6f97cde3e',
      resourceName: 'Rice',
      orderType: true,
      unitPrice: 1.1,
      quantity: 1,
      delivered: true,
      settlePrice: 1.1,
      quantityFulfilled: 0.5
    }

See tests for more robust examples
