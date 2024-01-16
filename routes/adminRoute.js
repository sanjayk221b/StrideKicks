const express = require('express');
const adminRouter = express();
const adminController = require('../controller/adminController');
const productsController = require('../controller/productsController');
const orderController = require('../controller/orderController')
const path = require('path')
const adminAuth = require('../midddleware/adminAuth')

const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, "..", "public", "images"))
    },
    filename: (req, file, callback) => {
        const name = Date.now() + '-' + file.originalname;
        callback(null, name)
    }
})

const upload = multer({ storage: storage }).array('images')



//set view engine
adminRouter.set('view engine', 'ejs');
adminRouter.set('views', './views/admin');

adminRouter.use(express.static(path.resolve(__dirname, 'public')))

adminRouter.get('/', adminAuth.isAdminLogin,adminController.loadDashboard);

//login and logout
adminRouter.get('/login', adminAuth.isAdminLogout, adminController.loadLogin);
adminRouter.post('/login', adminController.adminLogin);
adminRouter.get('/logout',adminController.logoutAdmin);

//User management routes
adminRouter.get('/users',adminAuth.isAdminLogin, adminController.loadUsers);
adminRouter.post('/users/:action/:id', adminController.updateUserStatus);


//Product management routes
adminRouter.get('/products',adminAuth.isAdminLogin, productsController.loadProducts);
adminRouter.post('/products/:id', productsController.updateProductStatus)

adminRouter.get('/addProducts',adminAuth.isAdminLogin, productsController.load_AddProducts);
adminRouter.post('/addProducts', upload, productsController.addProducts);

adminRouter.get('/editProducts/:id',adminAuth.isAdminLogin, productsController.load_EditProducts)
adminRouter.post('/editProducts', upload, productsController.editProducts);
adminRouter.post('/deleteProducts/:productId', productsController.deleteProducts)
adminRouter.post('/deleteImage', productsController.deleteImage)

//Category management routes
adminRouter.get('/categories',adminAuth.isAdminLogin, adminController.loadCategories);
adminRouter.post('/categories/:action/:id', adminController.updateCategoryStatus)

adminRouter.get('/addCategories',adminAuth.isAdminLogin, adminController.load_AddCategories);
adminRouter.post('/addCategories', adminController.addCategories);

adminRouter.get('/editCategories',adminAuth.isAdminLogin, adminController.load_EditCategories);
adminRouter.post('/editCategories', adminController.editCategories);

adminRouter.delete('/deleteCategories/:id',adminAuth.isAdminLogin, adminController.deleteCategories)

//Order Management Routes
adminRouter.get('/orders',adminAuth.isAdminLogin,orderController.load_AdminOrders);
adminRouter.get('/orderDetails',adminAuth.isAdminLogin,orderController.load_AdminSingleOrder);
 
adminRouter.post('/updateOrderStatus',adminAuth.isAdminLogin,orderController.updateOrderStatus)


module.exports = adminRouter;
