const User = require('../model/userModel')

const isLogin = async (req, res, next) => {
    try {
        console.log('Login session', req.session.userId, 'hi');
        //check If the user is logged in 
        if (req.session.userId) {
            //if the user is logged in and trying to access the /login route, redirect to /home
            if (req.path === '/login') {
                res.redirect('/home');
                return;
            }
            //continue to the next middleware if the User is logged in
            next();
        } else {
            //if the user is not logged in redirect back to login page
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
    }
}

const isLogout = async (req, res, next) => {
    try {
        // console.log('session',req.session.userId);
        // checks if the user is logged in
        if (req.session.userId) {
            // if the user is logged in redirect to '/home'
            res.redirect('/home');
            return;
        }
        //continue to the next middleware if the user is logged out
        next();
    } catch (error) {

    }
}


const checkBlocked = async (req, res, next) => {
    const userId = req.session.userId;
    console.log(userId);

    if (userId) {
        try {
            const user = await User.findOne({ _id: userId });
            if (user && user.isBlocked === true) {
                
                return res.redirect('/');
            }
        } catch (error) {
            console.log(error);
        }
    }
    next();
};



module.exports = {
    isLogin,
    isLogout,
    checkBlocked
}