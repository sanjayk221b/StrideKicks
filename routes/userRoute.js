const express = require("express");
const userRouter = express();
const userController = require("../controller/userController");
const cartController = require("../controller/cartController")
const orderController = require('../controller/orderController');
const auth = require('../midddleware/auth');

//set view engine
userRouter.set('view engine', 'ejs');
userRouter.set('views', './views/user')


userRouter.get("/", auth.isLogout, userController.loadHome);
userRouter.get("/home", auth.checkBlocked, userController.loadHome)

userRouter.get("/error403", userController.error403);

userRouter.get("/register", auth.isLogout, userController.loadRegister)
userRouter.post("/register", userController.verifyRegister)

userRouter.get("/otp", auth.isLogout, userController.loadOtp)
userRouter.post("/otp", userController.verifyOtp)

userRouter.post('/admin/resendOtp', auth.isLogout, userController.resendOtp);

userRouter.get("/login", auth.isLogout, userController.loadLogin)
userRouter.post("/login", userController.verifyLogin)

userRouter.get("/logout", auth.isLogin, userController.logoutUser)

userRouter.get('/shop', auth.checkBlocked, userController.loadShop)

userRouter.get('/productDetails', auth.checkBlocked,auth.isLogin, userController.loadProductDetails)


userRouter.get('/cart',auth.checkBlocked,auth.isLogin,cartController.loadCart);
userRouter.post('/addToCart',auth.checkBlocked,auth.isLogin,cartController.addToCart);
userRouter.post('/updateCart',auth.checkBlocked,auth.isLogin,cartController.updateCart);
userRouter.delete('/cart/removeItem',auth.checkBlocked,auth.isLogin,cartController.removeItem);

userRouter.get('/checkout',auth.checkBlocked,auth.isLogin,cartController.loadCheckout);

userRouter.post('/placeOrder',auth.checkBlocked,auth.isLogin,orderController.placeOrder);

userRouter.get('/confirmation',auth.checkBlocked, auth.isLogin,orderController.load_orderConfirmation);

userRouter.get('/profile',auth.checkBlocked,auth.isLogin,userController.loadProfile);

userRouter.get('/editProfile',auth.checkBlocked,auth.isLogin,userController.load_EditProfile);

userRouter.get('/address',auth.checkBlocked,auth.isLogin,userController.load_AddAddress);
userRouter.post('/address',auth.checkBlocked, auth.isLogin,userController.addAddress);

module.exports = userRouter;      