const User = require('../model/userModel');
const Cart = require('../model/cartModel');
const Order = require('../model/ordersModel');
const Product = require('../model/productsModel');
const Coupon = require('../model/couponModel');
const moment = require('moment');
const Razorpay = require('razorpay');


//=============================================== User Side ============================================================
//Razorpay instance
var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});


// Place Orders
const placeOrder = async (req, res) => {
    try {
        console.log('place order req body :', req.body)
        const date = new Date();
        const { userId } = req.session;
        const { address, paymentMethod, couponCode } = req.body;

        const cartData = await Cart.findOne({ userId: userId });
        const userData = await User.findById({ _id: userId });
        const cartProducts = cartData.items;

        // Checking if the quantity in the cart is not greater than the stock quantity
        for (const item of cartProducts) {
            const product = await Product.findById(item.productId);

            // Checking if the product exists and is listed
            if (!product || item.quantity > product.stockQuantity || !product.isListed) {
                return res.status(400).json({
                    success: false,
                    error: "One or more products in your cart are unavailable or have insufficient stock.",
                });
            }
        }
        let totalAmount = cartData.items.reduce((total, item) => total + item.totalPrice, 0);
        let discountAmount;
        let discountPerItem;
        // Check If Coupon Applied
        if (couponCode) {
            // Check if the user has claimed the coupon earlier
            const userClaimedCoupon = await Coupon.findOne({
                couponCode: couponCode,
                "usersClaimed.userId": userId
            });

            if (!userClaimedCoupon) {
                const coupon = await Coupon.findOne({ couponCode: couponCode });
                totalAmount -= coupon.discountAmount;
                discountAmount = coupon.discountAmount;
                const numberOfProducts = cartData.items.length;
                discountPerItem = coupon.discountAmount / numberOfProducts;

                // Update the Coupon to mark it as claimed by the current user
                const updateCoupon = await Coupon.updateOne(
                    { _id: coupon._id },
                    { $push: { usersClaimed: { userId: userId } } }
                );
            } else {
                return res.status(400).json({
                    success: false, error: 'User has already claimed the coupon.',
                });
            }
        }

        const status = paymentMethod === "COD" || paymentMethod === "WALLET" ? "placed" : "Pending";
        const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
        const deliveryDate = delivery
            .toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
            })
            .replace(/\//g, "-");
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderRand = "MFTS" + randomNum;

        const updatedItems = cartProducts.map(item => {
            const updatedItem = { ...item.toObject(), discountPerItem: discountPerItem };
            return updatedItem;
        });
        // console.log('updated items after discountPerItem :', updatedItems)

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
            totalDiscountAmount: discountAmount,
            items: updatedItems,
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
        console.log('userData.wallet :', userData.wallet);
        console.log('totalAmount :', totalAmount);
        if (status === "placed" && paymentMethod === "WALLET") {
            // Update user's wallet
            console.log('inside the update wallet', userData.wallet, totalAmount)
            userData.wallet -= totalAmount;
            console.log(userData.wallet)
            // Update wallet history
            userData.wallet_history.push({
                date: new Date(),
                amount: totalAmount,
                description: `Placed Order From wallet `

            });
            await userData.save();

        }
        if (orders.status === "placed") {
            await Cart.deleteOne({ userId: userId });
            return res.json({ success: true, orderId: orderId });
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
        console.log('verify Payment body :', req.body)
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

            console.log('order sending to checkout page from verify payment :', order);
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
        // console.log('order id in query orderConfirmaton:', orderId);

        const order = await Order.findOne({ orderId: orderId }).populate({ path: 'items.productId' })
        const user = await User.findOne({ _id: userId });


        // console.log('user in orderConfirmation', user);
        // console.log('order in orderConfirmation', order);
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
        const page = req.query.page || 1; // Default to page 1
        const limit = 3;

        const totalOrders = await Order.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.find({ userId: userId })
            .populate('items.productId')
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('userOrders', { orders, moment, totalPages, currentPage: page });
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
        const orders = await Order.find({ status: { $ne: 'Pending' } }).populate({ path: 'items.productId' });
        res.render('adminOrders', { orders, moment });
    } catch (error) {
        console.log(error);
    }
}


// Update Order Status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, itemId, newStatus } = req.body;
        const { userId } = req.session;
        console.log("update orderStatus req", req.body);

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
            };
            // Calculate discount amount for the item
            const discountAmount = item.discountPerItem || 0;
            const deductedAmount = item.totalPrice - discountAmount;

            // Update user's wallet
            const user = await User.findById(userId);
            user.wallet += deductedAmount;

            // Update wallet history
            user.wallet_history.push({
                date: new Date(),
                amount: deductedAmount,
                description: `Refund For Order ${order.orderId} `
            });

            await user.save();
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
        console.log('single order query', req.query);
        const { userId } = req.session;
        const { itemId } = req.query;
        const orderItem = await Order.findOne({ 'items._id': itemId })
            .populate('items.productId');

        res.render('adminSingleOrder', { orderItem, moment });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};




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
