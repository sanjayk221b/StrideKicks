const User = require('../model/userModel');
const Cart = require('../model/cartModel');
const Order = require('../model/ordersModel')
const moment = require('moment')

//=============================================== User Side ============================================================

//Place Order
const placeOrder = async (req, res) => {
    try {
        const date = new Date();
        const userId = req.session.userId;
        const { address, paymentMethod } = req.body;
        // console.log(' deliveryAddress in Place Order ',address);

        const cartData = await Cart.findOne({ userId: userId });
        const userData = await User.findById({ _id: userId });
        const cartProducts = cartData.items;

        const status = paymentMethod === "COD" ? "placed" : "pending";
        const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
        const deliveryDate = delivery
            .toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
            })
            .replace(/\//g, "-");
        const totalPrice = cartData.items.reduce((total, item) => total + item.totalPrice, 0);
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderRand = "MFTS" + randomNum;

        // Ensure that the deliveryAddress is set
        const orderData = new Order({
            userId: userId,
            orderId: orderRand,
            deliveryAddress: address,
            username: userData.username,
            totalAmount: totalPrice,
            date: Date.now(),
            status: status,
            expectedDelivery: deliveryDate,
            payment: paymentMethod,
            items: cartProducts
        });

        let orders = await orderData.save();
        const orderId = orders._id;

        if (orders.status === 'placed') {
            await Cart.deleteOne({ userId: userId });
            res.json({ success: true, orderId: orderId });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

//Cancel Orders 
const cancelOrder = async (req, res) => {
    console.log('cancel request recieved', req.body);
    const { orderId, itemId, reason, returnReason } = req.body;

    try {
        if (reason) {
            const updatedOrder = await Order.updateOne(
                { orderId: orderId, 'items._id': itemId },
                {
                    $set: {
                        'items.$.orderStatus': 'request_cancellation',
                        'items.$.cancellationReason': reason
                    }
                }
            );

            res.status(200).json({ message: 'Order cancellation requested', order: updatedOrder });

        }

        if (returnReason) {
            const updatedOrder = await Order.updateOne(
                { orderId: orderId, 'items._id': itemId },
                {
                    $set: {
                        'items.$.orderStatus': 'request_return',
                        'items.$.cancellationReason': returnReason
                    }
                }
            );

            res.status(200).json({ message: 'Order return requested', order: updatedOrder });

        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



//Order Confirmation Page
const load_orderConfirmation = async (req, res) => {
    try {
        const userId = req.session.userId
        const orderId = req.query.orderId;
        console.log('order id in query', orderId);

        const order = await Order.findOne({ _id: orderId }).populate({ path: 'items.productId' })
        const user = await User.findOne({ _id: userId });


        console.log('user in orderConfirmation', user);
        console.log('order in orderConfirmation', order);
        // console.log('orderId in confirmation Load', orderId);

        res.render('orderConfirmation', { user: user, order: order, moment })
    } catch (error) {
        console.log(error);
    }
}

//User Profile Orders
const load_userOrders = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orders = await Order.find({ userId: userId }).populate('items.productId');
        res.render('userOrders', { orders: orders, moment })
    } catch (error) {
        console.log(error);
    }
}

//User Profile Single Order
const load_SingleOrder = async (req, res) => {
    try {
        console.log('signle order query',req.query);
        const userId = req.session.userId;
        const orderId = req.query.orderId;
        const orders = await Order.find({ orderId: orderId }).populate('items.productId');

        res.render('singleOrder', { orders: orders, moment })
    } catch (error) {
        console.log(error);
    }
}


//=============================================== Admin Side ============================================================

//load Admin Order Management
const load_AdminOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate({ path: 'items.productId' })
        res.render('adminOrders', { orders, moment });
    } catch (error) {
        console.log(error);
    }
}


// Update Order Status
const updateOrderStatus = async (req, res) => {
    try {

        const { orderId, itemId, newStatus } = req.body;

        console.log("order Status req", req.body)

        // Define the update object
        let update = {
            'items.$.orderStatus': newStatus,
            'items.$.status': newStatus
        };

        // Find the order by orderId
        const order = await Order.findById(orderId);

        // Find the item within the order
        const item = await order.items.find((item) => item._id.toString() === itemId);

        // Perform the update using findOneAndUpdate
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, 'items._id': itemId },
            { $set: update },
            { new: true }
        );

        // Send a JSON response with the updated order
        res.json({ success: true, updatedOrder });
    } catch (error) {
        console.log(error);
        // Handle the error and send an appropriate response
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



module.exports = {
    //User Side
    placeOrder,
    load_orderConfirmation,
    load_userOrders,
    cancelOrder,

    //Admin Side
    load_AdminOrders,
    load_SingleOrder,
    updateOrderStatus
}; 
