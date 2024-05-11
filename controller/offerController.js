const User = require('../model/userModel');
const Categories = require('../model/categoriesModel');
const Products = require('../model/productsModel');
const Orders = require('../model/ordersModel');
const Offer = require('../model/offersModel');
const moment = require('moment')

//===========================Admin=========================================

//Load Offers
const loadOffers = async (req, res) => {
    try {
        const offers = await Offer.find({});
        res.render('offers', { offers, moment });
    } catch (error) {
        console.log(error)
        res.redirect('/500');
    }
}

//Load Add Offers
const load_addOffers = async (req, res) => {
    try {
        res.render('addOffer');
    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
}

//Add Offers
const addOffer = async (req, res) => {
    try {
        const { name, startingDate, expiryDate, percentage } = req.body;
        const existingOffer = await Offer.findOne({ name: name });

        if (existingOffer) {
            return res.json({ existingOffer: 'offer already exists' });
        } else {
            const offer = new Offer({
                name,
                startingDate,
                expiryDate,
                percentage
            });
            await offer.save();
            res.redirect("/admin/Offers");
        }
    } catch (error) {
        console.log(error)
        res.redirect('/500');
    }
}

//Delete Offer 
const deleteOffer = async (req, res) => {
    try {
        console.log("delete request recieved", "req.query")
        const { offerId } = req.query;
        await Offer.findByIdAndDelete({ _id: offerId })
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" });

    }
}

// Apply Category Offer
const applyCategoryOffer = async (req, res) => {
    try {
        const { offerId, categoryId } = req.body;
        const updatedCategory = await Categories.updateOne({ _id: categoryId }, { $set: { offer: offerId } });

        return res.json({ sucess: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

// Remove Category Offer 
const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const category = await Categories.findOne({ _id: categoryId });
        const offerId = category.offer;
        const categoryName = category.name;
        const updatedCategory = await Categories.updateOne({ _id: categoryId }, { $unset: { offer: offerId } }, { new: true });
        await Products.updateMany(
            { category: categoryName },
            { $unset: { offer: 1, offerPrice: 1 } }
        );
        return res.json({ sucess: true });
    } catch (error) {
        res.redirect('/500');
    }
}


// Apply Product Offer
const applyProductOffer = async (req, res) => {
    try {
        const { offerId, productId } = req.body;
        const updatedProduct = await Products.updateOne(
            { _id: productId },
            {
                $set: {
                    offer: offerId,
                },
            }
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('Error applying offer:', error);
        res.redirect('/500');
    }
}



//Remove Product Offer
const removeProductOffer = async (req, res) => {
    try {
        console.log("removeProduct offer req body", req.body)

        const { offerId, productId } = req.body;
        await Products.updateOne(
            { _id: productId },
            {
                $unset: {
                    offer: 1, offerPrice: 1
                },
            }
        );
        return res.json({ success: true });
    } catch (error) {
        res.redirect('/500');
    }
}



module.exports = {
    loadOffers,
    addOffer,
    deleteOffer,
    load_addOffers,
    applyCategoryOffer,
    removeCategoryOffer,
    applyProductOffer,
    removeProductOffer

}