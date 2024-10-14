const Coupon = require('../model/couponModel');
const moment = require('moment')

// ===================User======================

//applyCoupon
const applyCoupon = async (req, res) => {
    try {
        const { userId } = req.session;
        const { couponCode, subTotal } = req.body;
        const existingCoupon = await Coupon.findOne({ couponCode: couponCode });

        if (!existingCoupon) {
            return res.json({ wrongCoupon: true });
        }

        const minAmount = existingCoupon.minAmount;
        const discountAmount = existingCoupon.discountAmount;
        const status = existingCoupon.status;
        const currentDate = new Date();
        const expiryDate = existingCoupon.expiryDate;

        if (subTotal <= minAmount) {
            return res.json({ minAmountError: `Minimum purchase amount required: ₹${minAmount}` });
        }

        if (currentDate > expiryDate || status !== 'Active') {
            return res.json({ expired: true });
        }

        const couponId = existingCoupon._id;
        const couponClaimed = await Coupon.findOne({ _id: couponId, "usersClaimed.userId": userId });

        if (couponClaimed) {
            return res.json({ couponClaimed: true, message: 'Coupon has already been used.' });
        }

        const discountedTotal = subTotal - discountAmount;
        return res.json({ applied: true, discountedTotal: discountedTotal, discountAmount: discountAmount });
    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
};



// ===================Admin=====================
//Load Admin Coupon
const load_Coupon = async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.render('adminCoupons', { coupon: coupons, moment });
    } catch (error) {
        console.log(error)
        res.redirect('/500');
    }
}

//Load Add Coupon
const load_AddCoupon = async (req, res) => {
    try {
        res.render('addCoupons');
    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
}

//Add Coupon 
const addCoupon = async (req, res) => {
    try {
        // console.log(req.body);
        const { userId } = req.session;
        const { couponName, couponCode, discountAmount, description, quantity, minAmount, expiryDate } = req.body;
        const existingCoupon = await Coupon.findOne({ couponCode });
        if (existingCoupon) {
            req.flash('message','Coupon Code Already Exist');
            res.redirect('/admin/addCoupons')
        }

        const coupon = new Coupon({
            couponName,
            couponCode,
            discountAmount,
            minAmount,
            description,
            quantity,
            expiryDate
        })
        await coupon.save();
        res.redirect('/admin/coupons')
    } catch (error) {
        console.log(error);
        res.redirect('/500');
    }
}

//Delete Coupon
const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;
        console.log('req for delete coupon :', req.query)
        console.log('req for delete coupon body :', req.body)
        const coupon = await Coupon.findOne({ _id: couponId });
        console.log('coupon found', coupon)

        if (coupon) {
            await Coupon.findOneAndDelete({ _id: couponId });
            return res.status(200).json({ status: true, message: 'coupon deleted successfully' })
        } else {
            return res.status(404).json({ status: false, message: 'coupon not found' })
        }
    } catch (error) {
        console.log(error)
        res.redirect('/500');
    }
}

module.exports = {
    //User
    applyCoupon,

    //Admin
    load_Coupon,
    load_AddCoupon,
    addCoupon,
    deleteCoupon

}