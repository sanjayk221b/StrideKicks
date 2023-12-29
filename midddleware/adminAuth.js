const isAdminLogin = async (req, res, next) => {
    try {
        if(req.session.admin) {
            if(req.path === '/admin/login') {
                res.redirect('/admin/dashboard');
                return
            }
            next()
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.log(error);
    }
}

const isAdminLogout = (req, res, next) => {
    try {
        if(req.session.admin) {
            res.redirect('/admin')
        }
        next()
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    isAdminLogin,
    isAdminLogout
}