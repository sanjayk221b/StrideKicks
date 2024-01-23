const User = require('../model/userModel');
const Product = require('../model/productsModel');

//load Wishlist 
const load_Wishlist = async (req, res) => {
    try {
        const { userId } = req.session;
        const user = await User.findById(userId).populate("wishlist.productId");
        const wishlist = user.wishlist;
        res.render('wishlist', { wishlist })
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

//Add To Wishlist
const addToWishlist = async (req, res) => {
    try {
        const { userId } = req.session;
        const { productId } = req.body;
        console.log("add to wishlist req :", req.body);
        const existingProduct = await User.findOne({ _id: userId, "wishlist.productId": productId, });
        if (existingProduct) {
            return res.status(400).json({ success: false, error: 'product is already added to wishlist' })
        } else {
            await User.findOneAndUpdate({ _id: userId }, { $push: { wishlist: { productId } } });
            return res.status(200).json({ success: true })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

//Delete Product From wishlist 
const removeFromWishlist = async (req, res) => {
    try {
        console.log('remove from wishlist req :', req.body)
        const { userId } = req.session;
        const { productId } = req.body;

        const wishlist = await User.findByIdAndUpdate(userId, { $pull: { wishlist: { productId } } }, { new: true });
        return res.status(200).json({ success: true });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: "Internal Server Error" });

    }
}


module.exports = {
    load_Wishlist,
    addToWishlist,
    removeFromWishlist
}