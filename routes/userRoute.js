const express = require("express");
const userRouter = express();
const userController = require("../controller/userController");
const auth = require('../midddleware/auth')

//set view engine
userRouter.set('view engine', 'ejs');
userRouter.set('views', './views/user')


userRouter.get("/",auth.isLogout,userController.loadHome);
userRouter.get("/home",auth.isLogin,userController.loadHome)

userRouter.get("/register", auth.isLogout,userController.loadRegister)
userRouter.post("/register", userController.verifyRegister)

userRouter.get("/otp", auth.isLogout,userController.loadOtp)
userRouter.post("/otp", userController.verifyOtp)

userRouter.get("/login",auth.isLogout,userController.loadLogin)
userRouter.post("/login", userController.verifyLogin)

userRouter.get("/logout",auth.isLogin,userController.logoutUser)

userRouter.get('/shop', userController.loadShop)

userRouter.get('/productDetails', auth.isLogin,userController.loadProductDetails)


module.exports = userRouter;