const User = require('../model/userModel');
const Cart = require('../model/cartModel');
const Order = require('../model/ordersModel')
const moment = require('moment')


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


const load_orderConfirmation = async (req, res) => {
    try {
        const userId = req.session.userId
        const orderId = req.query.orderId;
        console.log('order id in query',orderId);

        const order = await Order.findOne({ _id: orderId }).populate({ path: 'items.productId' })
        const user = await User.findOne({ _id: userId });

        
        console.log('user in orderConfirmation',user);
        console.log('order in orderConfirmation',order);
        // console.log('orderId in confirmation Load', orderId);

        res.render('orderConfirmation', { user: user, order: order, moment })
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    placeOrder,
    load_orderConfirmation
};
