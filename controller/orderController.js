const User = require('../model/userModel');
const Cart = require('../model/cartModel');
const Order = require('../model/ordersModel');
const Product = require('../model/productsModel')
const moment = require('moment')
const Razorpay = require('razorpay');
//=============================================== User Side ============================================================

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});


// Place Order
const placeOrder = async (req, res) => {
    try {
        const date = new Date();
        const { userId } = req.session;
        const { address, paymentMethod } = req.body;

        const cartData = await Cart.findOne({ userId: userId });
        const userData = await User.findById({ _id: userId });
        const cartProducts = cartData.items;

        // Check if the quantity in the cart is not greater than the stock quantity
        for (const item of cartProducts) {
            const product = await Product.findById(item.productId);
            if (!product || item.quantity > product.stockQuantity) {
                return res.status(400).json({
                    success: false,
                    error: "One or more products in your cart have insufficient stock.",
                });
            }
        }

        const status = paymentMethod === "COD" ? "placed" : "pending";
        const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
        const deliveryDate = delivery
            .toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
            })
            .replace(/\//g, "-");
        const totalAmount = cartData.items.reduce((total, item) => total + item.totalPrice, 0);
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderRand = "MFTS" + randomNum;

        const orderData = new Order({
            userId: userId,
            orderId: orderRand,
            deliveryAddress: address,
            username: userData.username,
            totalAmount: totalAmount,
            date: Date.now(),
            status: status,
            expectedDelivery: deliveryDate,
            payment: paymentMethod,
            items: cartProducts,
        });

        let orders = await orderData.save();
        const orderId = orders.orderId;

        // Update stock quantity for each product
        for (const item of cartProducts) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stockQuantity -= item.quantity;
                await product.save();
            }
        }
        if (orders.status === "placed") {
            await Cart.deleteOne({ userId: userId });
            res.json({ success: true, orderId: orderId });
        } else {
            var options = {
                amount: totalAmount * 100,
                currency: "INR",
                receipt: "" + orderRand,
            };
            // console.log('Razorpay Options:', options);
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.error('Error creating Razorpay order:', err.error);
                    res.status(500).json({ success: false, error: "Error creating Razorpay order", details: err.error });
                } else {
                    // console.log('Razorpay order created:', order);

                    res.json({ order });
                }
            });

        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

// verify Payment
const verifyPayment = async (req, res) => {
    try {
        const details = req.body
        // console.log('verify Payment body :', req.body)
        const { userId } = req.session
        const cartData = await Cart.findOne({ userId: userId });
        const userData = await User.findById({ _id: userId });
        const cartProducts = cartData.items;

        const crypto = require('crypto');
        let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);

        hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id);
        hmac = hmac.digest('hex');
        // console.log('Data for hmac calculation:', details.payment.razorpay_payment_id, details.payment.razorpay_order_id);
        // console.log('Calculated hmac:', hmac);
        // console.log('Razorpay signature:', details.payment.razorpay_signature);


        if (hmac == details.payment.razorpay_signature) {
            const order = await Order.findOneAndUpdate({ orderId: details.order.receipt }, { $set: { status: "placed", paymentId: details.razorpay_payment_id } }, { new: true });

            console.log('order sending to checkout page from verify payment :' , order);
            // Update stock quantity for each product
            for (const item of cartProducts) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stockQuantity -= item.quantity;
                    await product.save();
                }
            }
            await Cart.deleteOne({ userId: userId });

            res.json({ success: true, order: order });
        } else {
            console.log('else case worked')
            await Order.deleteOne({ orderId: details.order.receipt });
            res.json({ success: false });
        }

    } catch (error) {
        console.log(error)
    }
}


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
        console.log('order id in query :', orderId);

        const order = await Order.findOne({ orderId: orderId }).populate({ path: 'items.productId' })
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
        console.log('signle order query', req.query);
        const userId = req.session.userId;
        const orderId = req.query.orderId;
        const orders = await Order.find({ orderId: orderId }).populate('items.productId');

        res.render('singleOrder', { orders: orders, moment });
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

        let update = {
            'items.$.orderStatus': newStatus,
            'items.$.status': newStatus
        };

        const order = await Order.findById(orderId);

        const item = await order.items.find((item) => item._id.toString() === itemId);

        // Check if the newStatus is returned or cancelled
        if (newStatus === 'returned' || newStatus === 'cancelled') {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stockQuantity += item.quantity;
                await product.save();
            }
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, 'items._id': itemId },
            { $set: update },
            { new: true }
        );

        res.json({ success: true, updatedOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

//User Profile Single Order
const load_AdminSingleOrder = async (req, res) => {
    try {
        console.log('signle order query', req.query);
        const userId = req.session.userId;
        const orderId = req.query.orderId;
        const orders = await Order.find({ orderId: orderId }).populate('items.productId');

        res.render('adminSingleOrder', { orders: orders, moment });
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    //User Side
    placeOrder,
    verifyPayment,
    load_orderConfirmation,
    load_userOrders,
    load_SingleOrder,
    cancelOrder,

    //Admin Side
    load_AdminOrders,
    updateOrderStatus,
    load_AdminSingleOrder
}; 
