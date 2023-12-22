const express = require('express');
const adminRouter = express();
const adminController = require('../controller/adminController');
const path = require('path')

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

const upload = multer({ storage: storage }).array('images', 4)



//set view engine
adminRouter.set('view engine', 'ejs');
adminRouter.set('views', './views/admin');

adminRouter.use(express.static(path.resolve(__dirname, 'public')))

adminRouter.get('/', adminController.loadDashboard);

adminRouter.get('/login', adminController.loadLogin);
adminRouter.post('/login', adminController.adminLogin);

adminRouter.get('/users', adminController.loadUsers);
adminRouter.post('/users/:action/:id', adminController.updateUserStatus);

adminRouter.get('/products', adminController.loadProducts);
adminRouter.post('/products/:id',adminController.updateProductStatus)


adminRouter.get('/addProducts', adminController.load_AddProducts);
adminRouter.post('/addProducts', upload, adminController.addProducts);

adminRouter.get('/editProducts/:id', adminController.load_EditProducts)
adminRouter.post('/editProducts',upload,adminController.editProducts);

adminRouter.get('/categories', adminController.loadCategories);
adminRouter.post('/categories/:action/:id', adminController.updateCategoryStatus)

adminRouter.get('/addCategories', adminController.load_AddCategories);
adminRouter.post('/addCategories', adminController.addCategories);

adminRouter.get('/editCategories', adminController.load_EditCategories);
adminRouter.post('/editCategories', adminController.editCategories);





module.exports = adminRouter;
