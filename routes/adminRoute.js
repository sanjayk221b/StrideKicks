const express = require('express');
const adminRouter = express();
const adminController = require('../controller/adminController');
const productsController = require('../controller/productsController');
const orderController = require('../controller/orderController');
const couponController = require('../controller/couponController');
const offerController = require('../controller/offerController');
const bannerController = require('../controller/bannerController');
const adminAuth = require('../midddleware/adminAuth');
const path = require('path');
const upload = require('../midddleware/upload');


//set view engine
adminRouter.set('view engine', 'ejs');
adminRouter.set('views', './views/admin');

//Static
adminRouter.use(express.static(path.resolve(__dirname, 'public')));

//Dashboard Routes
adminRouter.get('/', adminAuth.isAdminLogin, adminController.loadDashboard);
adminRouter.get('/salesReport', adminAuth.isAdminLogin, adminController.load_salesReport);
adminRouter.post('/datePicker', adminAuth.isAdminLogin, adminController.datePicker)

//login and logout
adminRouter.get('/login', adminAuth.isAdminLogout, adminController.loadLogin);
adminRouter.post('/login', adminController.adminLogin);
adminRouter.get('/logout', adminController.logoutAdmin);

//User management routes
adminRouter.get('/users', adminAuth.isAdminLogin, adminController.loadUsers);
adminRouter.post('/users/:action/:id', adminController.updateUserStatus);


//Product management routes
adminRouter.get('/products', adminAuth.isAdminLogin, productsController.loadProducts);
adminRouter.post('/products/:id', productsController.updateProductStatus);
adminRouter.get('/addProducts', adminAuth.isAdminLogin, productsController.load_AddProducts);
adminRouter.post('/addProducts', upload.upload, productsController.addProducts);
adminRouter.get('/editProducts/:id', adminAuth.isAdminLogin, productsController.load_EditProducts);
adminRouter.post('/editProducts', upload.upload, productsController.editProducts);
adminRouter.post('/deleteProducts/:productId', productsController.deleteProducts);
adminRouter.post('/deleteImage', productsController.deleteImage);

//Category management routes
adminRouter.get('/categories', adminAuth.isAdminLogin, adminController.loadCategories);
adminRouter.post('/categories/:action/:id', adminController.updateCategoryStatus);
adminRouter.get('/addCategories', adminAuth.isAdminLogin, adminController.load_AddCategories);
adminRouter.post('/addCategories', adminController.addCategories);
adminRouter.get('/editCategories', adminAuth.isAdminLogin, adminController.load_EditCategories);
adminRouter.post('/editCategories', adminController.editCategories);
adminRouter.delete('/deleteCategories/:id', adminAuth.isAdminLogin, adminController.deleteCategories);

//Order Management Routes
adminRouter.get('/orders', adminAuth.isAdminLogin, orderController.load_AdminOrders);
adminRouter.get('/orderDetails', adminAuth.isAdminLogin, orderController.load_AdminSingleOrder);
adminRouter.post('/updateOrderStatus', adminAuth.isAdminLogin, orderController.updateOrderStatus);

//Coupon Management Routes
adminRouter.get('/coupons', adminAuth.isAdminLogin, couponController.load_Coupon);
adminRouter.get('/addCoupons', adminAuth.isAdminLogin, couponController.load_AddCoupon);
adminRouter.post('/addCoupons', adminAuth.isAdminLogin, couponController.addCoupon);
adminRouter.delete('/deleteCoupon', adminAuth.isAdminLogin, couponController.deleteCoupon);

//Offer Management Routes 
adminRouter.get('/offers', adminAuth.isAdminLogin, offerController.loadOffers);
adminRouter.get('/addOffer', adminAuth.isAdminLogin, offerController.load_addOffers);
adminRouter.post('/addOffer', adminAuth.isAdminLogin, offerController.addOffer);
adminRouter.delete('/deleteOffer',adminAuth.isAdminLogin,offerController.deleteOffer);
adminRouter.patch('/applyCategoryOffer', adminAuth.isAdminLogin, offerController.applyCategoryOffer);
adminRouter.patch('/removeCategoryOffer', adminAuth.isAdminLogin, offerController.removeCategoryOffer);
adminRouter.patch('/applyProductOffer', adminAuth.isAdminLogin, offerController.applyProductOffer);
adminRouter.patch('/removeProductOffer', adminAuth.isAdminLogin, offerController.removeProductOffer);

//Banner Management Routes 
adminRouter.get('/banner', adminAuth.isAdminLogin, bannerController.loadBanner);
adminRouter.get('/addBanner', adminAuth.isAdminLogin, bannerController.load_AddBanner);
adminRouter.post('/addBanner', upload.upload, bannerController.addBanner);
adminRouter.get('/editBanner', adminAuth.isAdminLogin, bannerController.load_EditBanner);
adminRouter.post('/editBanner', upload.upload, bannerController.editBanner);
adminRouter.delete('/deleteBanner', adminAuth.isAdminLogin, bannerController.deleteBanner);

module.exports = adminRouter;
