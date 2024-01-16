const User = require('../model/userModel');
const Products = require('../model/productsModel');
const Categories = require('../model/categoriesModel');
const Cart = require('../model/cartModel');


//Load Cart
const loadCart = async (req, res) => {
    try {
        const userId = req.session.userId
        if (userId) {
            const cartDetails = await Cart.findOne({ userId: userId }).populate({ path: 'items.productId' });
            const user = await User.findOne({ _id: userId });

            let amount = 0;
            if (cartDetails) {
                cartDetails.items.forEach((cartItem => {
                    let itemPrice = cartItem.price;
                    amount += itemPrice * cartItem.quantity
                }))
            }

            res.render('cart', { cart: cartDetails, user: user, subTotal: amount })
        }
    } catch (error) {
        console.log(error);
    }
}

//Add To Cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.userId;

        if (userId) {
            const product = await Products.findOne({ _id: productId });
            let cart = await Cart.findOne({ userId: userId });

            if (cart) {
                const existingProduct = cart.items.find((x) => x.productId.toString() === productId);
                if (existingProduct) {
                    await Cart.findOneAndUpdate({ userId: userId, 'items.productId': productId },
                        {
                            $inc: {
                                'items.$.quantity': quantity,
                                'items.$.totalPrice': quantity * existingProduct.price
                            }
                        })
                } else {
                    await Cart.findOneAndUpdate(
                        { userId: userId }, {
                        $push: {
                            items: {
                                productId: productId,
                                quantity: quantity,
                                price: product.price,
                                totalPrice: product.price * quantity
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
                        price: product.price,
                        totalPrice: product.price * quantity
                    }]
                })
                await newCart.save()
            }
            res.status(200).json({ success: true, message: 'Product added to cart successfully' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: 'Error adding the items to cart' });
    }
}

//update Cart
const updateCart = async (req, res) => {
    try {
        const { userId } = req.session;
        const { cartItems } = req.body;
        // console.log(req.body);

        for (const { productId, quantity } of cartItems) {
            const product = await Products.findOne({ _id: productId });

            if (product && product.price !== null) {
                // console.log(product.price);
                await Cart.findOneAndUpdate(
                    { userId: userId, 'items.productId': productId },
                    {
                        $set: {
                            'items.$.quantity': quantity,
                            'items.$.totalPrice': product.price * quantity
                        }
                    }
                );
            } else {
                // console.log(`Product with ID ${productId} not found or has no price.`);
                console.log(error);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: 'Error updating the cart' });
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

//load Checkout
const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId
        if (userId) {
            const cartDetails = await Cart.findOne({ userId: userId }).populate({ path: 'items.productId' });
            const user = await User.findOne({ _id: userId });

            let amount = 0;
            if (cartDetails) {
                cartDetails.items.forEach((cartItem => {
                    let itemPrice = cartItem.price;
                    amount += itemPrice * cartItem.quantity
                }))
            }

            res.render('checkout', { cart: cartDetails, user: user, subTotal: amount })
        }
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    loadCart,
    addToCart,
    updateCart,
    removeItem,
    loadCheckout,
}