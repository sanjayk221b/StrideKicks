const User = require('../model/userModel');
const Products = require('../model/productsModel');
const Categories = require('../model/categoriesModel');
const Cart = require('../model/cartModel');
const Coupons = require('../model/couponModel');


//Load Cart
const loadCart = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (userId) {
            const cartDetails = await Cart.findOne({ userId: userId }).populate({ path: 'items.productId' });
            const user = await User.findOne({ _id: userId });
            const coupons = await Coupons.find({});

            let amount = 0;
            if (cartDetails) {
                cartDetails.items.forEach((cartItem) => {
                    let itemPrice = cartItem.productId.offerPrice || cartItem.productId.price;
                    amount += itemPrice * cartItem.quantity;
                });
            }

            res.render('cart', { cart: cartDetails, user: user, subTotal: amount, coupons: coupons });
        }
    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
};


//Add To Cart
const addToCart = async (req, res) => {
    try {
        console.log("addToCart req recieved", req.body);
        const { productId, quantity } = req.body;
        const userId = req.session.userId;

        if (userId) {
            const product = await Products.findOne({ _id: productId }).populate('offer');
            let offerPrice = product.offerPrice || product.price
            let cart = await Cart.findOne({ userId: userId });

            if (cart) {
                const existingProduct = cart.items.find((x) => x.productId.toString() === productId);
                if (existingProduct) {
                    await Cart.findOneAndUpdate({ userId: userId, 'items.productId': productId },
                        {
                            $inc: {
                                'items.$.quantity': quantity,
                                'items.$.totalPrice': quantity * offerPrice
                            }
                        })
                } else {
                    await Cart.findOneAndUpdate(
                        { userId: userId }, {
                        $push: {
                            items: {
                                productId: productId,
                                quantity: quantity,
                                price: offerPrice,
                                totalPrice: offerPrice * quantity
                            }
                        }
                    })
                }
            } else {
                //create new cart and the products
                const newCart = new Cart({
                    userId: userId,
                    items: [{
                        productId: productId,
                        quantity: quantity,
                        price: offerPrice,
                        totalPrice: offerPrice * quantity
                    }]
                })
                await newCart.save()
            }
            res.status(200).json({ success: true, message: 'Product added to cart successfully' });
        }

    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
}

const updateCart = async (req, res) => {
    try {
        const { userId } = req.session;
        const { cartItems } = req.body;

        for (const { productId, quantity } of cartItems) {
            const product = await Products.findOne({ _id: productId });

            if (product) {
                let itemPrice = product.offerPrice || product.price;

                await Cart.findOneAndUpdate(
                    { userId: userId, 'items.productId': productId },
                    {
                        $set: {
                            'items.$.quantity': quantity,
                            'items.$.totalPrice': itemPrice * quantity
                        }
                    }
                );
            } else {
                console.log(`Product with ID ${productId} not found.`);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
};



const removeItem = async (req, res) => {
    try {
        const { userId } = req.session;
        const { productId } = req.body;

        await Cart.updateOne(
            { userId: userId },
            { $pull: { items: { productId: productId } } }
        );

        res.json({ success: true, message: 'Product removed from cart successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: 'Error removing the product from cart' });
    }
};

const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (userId) {
            const cartDetails = await Cart.findOne({ userId: userId }).populate({ path: 'items.productId' });
            const user = await User.findOne({ _id: userId });
            const coupons = await Coupons.find({ status: 'Active' });
            let amount = 0;

            if (cartDetails) {
                cartDetails.items.forEach((cartItem) => {
                    let itemPrice = cartItem.productId.offerPrice || cartItem.productId.price;
                    amount += itemPrice * cartItem.quantity;
                });
            }

            res.render('checkout', { cart: cartDetails, user: user, subTotal: amount, coupons: coupons });
        }
    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
};




module.exports = {
    loadCart,
    addToCart,
    updateCart,
    removeItem,
    loadCheckout,
}