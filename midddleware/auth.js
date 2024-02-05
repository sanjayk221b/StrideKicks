const User = require('../model/userModel')

const isLogin = async (req, res, next) => {
    try {

        if (req.session.userId) {

            if (req.path === '/login') {
                res.redirect('/home');
                return;
            }
            next();
        } else {

            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.userId) {
            res.redirect('/home');
            return;
        }
        next();
    } catch (error) {

    }
}


const checkBlocked = async (req, res, next) => {
    const userId = req.session.userId;
    try {
        if (userId) {
            const user = await User.findOne({ _id: userId });
            if (user && user.isBlocked === true) {
                req.session.userId = null
                return res.redirect('/error403');
            }
        }
        next();
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    isLogin,
    isLogout,
    checkBlocked
}