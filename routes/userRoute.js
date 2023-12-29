const express = require("express");
const userRouter = express();
const userController = require("../controller/userController");
const auth = require('../midddleware/auth')

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


module.exports = userRouter;