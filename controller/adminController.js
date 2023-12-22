const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const User = require('../model/userModel');
const Categories = require('../model/categoriesModel')
const Products = require('../model/productsModel')
const sharp = require('sharp');
const path = require('path');

//Verify Admin Login
const adminLogin = async (req, res) => {
    try {
        const admin_email = process.env.admin_email;
        const admin_pass = process.env.admin_pass;

        const email = req.body.email;
        const password = req.body.password;

        if (admin_email == email && admin_pass == password) {

            res.redirect('/admin')
        } else {
            res.render('login', { message: 'invalid username and password' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

//Block Or Unblock user
const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).send('User not found');
        }
        let updatedUser;
        if (userData.isBlocked) {
            updatedUser = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true });
        } else {
            updatedUser = await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });
        }
        res.send({ status: 'success', user: updatedUser })
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

//Add New Categories
const addCategories = async (req, res) => {
    try {
        const categoryExist = await Categories.findOne({ name: req.body.name })

        if (categoryExist) {
            res.render('addCategories', { message: 'categories already exists' })
        } else {
            const categories = new Categories({
                name: req.body.name,
                description: req.body.description
            })
            await categories.save();

            res.redirect('/admin/categories')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//Edit Categories
const editCategories = async (req, res) => {
    try {
        // console.log(req.body);
        await Categories.findByIdAndUpdate(req.body.id, { name: req.body.categoryName, description: req.body.description })
        res.redirect('/admin/categories')
    } catch (error) {
        console.log(error.message);
    }
}



const updateCategoryStatus = async (req, res) => {
    try {
        // console.log(req.params);
        const categoryId = req.params.id;
        const categoryData = await Categories.findById(categoryId);
        if (!categoryData) {
            return res.status(404).send('category not found');
        }
        let updatedCategory;
        if (categoryData.isListed) {
            updatedCategory = await Categories.findByIdAndUpdate(categoryId, { isListed: false }, { new: true });
        } else {
            updatedCategory = await Categories.findByIdAndUpdate(categoryId, { isListed: true }, { new: true });

        }
        res.json({ status: true, categories: updatedCategory })
    } catch (error) {
        console.log(error.message);
    }
}

const addProducts = async (req, res) => {
    try {
        // console.log(req.body);
        const data = await Categories.find({ isListed: true });

        const productExists = await Products.findOne({ name: req.body.name });

        if (productExists) {
            return res.render('addProducts', { message: 'product already exist', categories: data })
        } else {
            const { name, description, price, quantity, date, category } = req.body;
            const filenames = [];

            // res.render('addProducts', { categories: data });

            if (req.files.length !== 4) {
                return res.render('addProducts', { message: '4 images needed', categories: data })
            }

            //resize each image and upload image
            for (let i = 0; i < req.files.length; i++) {
                // console.log(req.files);
                const imagePath = path.join(__dirname, '../public/sharpImages', req.files[i].filename)
                await sharp(req.files[i].path).resize(800, 1200, { fit: 'fill' }).toFile(imagePath)
                filenames.push(req.files[i].filename)
            }
            const newProduct = new Products({
                name,
                description,
                price,
                category,
                image: filenames,
                stockQuantity: quantity,
                date,
            })
            console.log(newProduct.image)

            await newProduct.save();
            res.redirect('/admin/products');
            console.log(newProduct);
        }
    } catch (error) {
        console.log(error);
    }
}

const updateProductStatus = async (req, res) => {
    try {
        const productId = req.params.id;
        // console.log(id);
        const productData = await Products.findById(productId);

        if (!productData) {
            return res.status(404).send('product not found')
        }

        let updatedProduct;
        if (productData.isListed) {
            updatedProduct = await Products.findByIdAndUpdate(productId, { isListed: false }, { new: true });
        } else {
            updatedProduct = await Products.findByIdAndUpdate(productId, { isListed: true }, { new: true });
        }
        res.json({ status: true, products: updatedProduct })
    } catch (error) {
        console.log(error);
    }

}

const editProducts = async (req, res) => {
    try {
        console.log('fsddfsdf',req.body);

        console.log('params:',req.params);

      
      const {id, name, description, price, category, quantity } = req.body;
  
      const data = await Products.findOne({ isListed: true }); 
      const categories = await Categories.find({ isListed: true }); 
  
      // Check if a new image is uploaded
      let imageData = [];
      if (req.files) {  
        const existingImageCount = (await Products.findById(id)).image.length;
  
        // Validate total number of images
        // if (existingImageCount + req.files.length !== 4) {
        //   return res.render('editProducts', { message: 'Only 4 images allowed', products: data, categories: categories });
        // }
  
        for (let i = 0; i < req.files.length; i++) {
          const resizedPath = path.join(__dirname, '../public/sharpImages', req.files[i].filename);
  
          // Resize image using sharp
          await sharp(req.files[i].path) 
            .resize(800, 1200, { fit: 'fill' })
            .toFile(resizedPath);
  
          // Push the resized filename to the array
          imageData.push(req.files[i].filename);
        }
      }
  
      // Update the product in the database
      const updatedProduct = await Products.findByIdAndUpdate(
        { _id: id },
        {
          name,
          description,
          price,
          category,
          stockQuantity: quantity,
          $set: { image: imageData },
        },
        { new: true }
      );
  
      // Redirect back to the product page
      res.redirect('/admin/products');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  





//Render Pages

//loadLogin 
const loadLogin = async (req, res) => {
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message)
    }
}

//Load Dashboard
const loadDashboard = async (req, res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.log(error.message);
    }
}

//Load users 
const loadUsers = async (req, res) => {
    try {
        const users = await User.find({})
        res.render('users', { users: users });
    } catch (error) {
        console.log(error.message)
    }
}


//load Categories
const loadCategories = async (req, res) => {
    try {
        const categories = await Categories.find({})
        res.render('categories', { categories: categories });
    } catch (error) {
        console.log(error.message)
    }
}

//Load Add Categories
const load_AddCategories = async (req, res) => {
    try {
        res.render('addCategories');
    } catch (error) {
        console.log(error.message)
    }
}

//Load Edit Categories
const load_EditCategories = async (req, res) => {
    try {
        const id = req.query.categoryId;
        const data = await Categories.findOne({ _id: id })
        if (!data) {
            return res.status(404).send("category not found");
        }
        res.render('editCategories', { categories: data });
    } catch (error) {
        console.log(error.message)
    }
}

//Load Products
const loadProducts = async (req, res) => {
    try {
        const products = await Products.find({})
        res.render('products', { products: products })
    } catch (error) {
        console.log(error.message)
    }
}

//Load Add Products
const load_AddProducts = async (req, res) => {
    try {
        const data = await Categories.find({ isListed: true })
        res.render('addProducts', { categories: data })
    } catch (error) {
        console.log(error.message);
    }
}

//Load Edit Products
const load_EditProducts = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id);
        const productData = await Products.findOne({ _id: id });
        const categoryData = await Categories.find({ isListed: true })
        console.log(productData);
        console.log(categoryData);
        res.render('editProducts', { products: productData, categories: categoryData })
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    loadLogin,
    adminLogin,
    loadDashboard,
    loadUsers,
    updateUserStatus,
    loadCategories,
    load_AddCategories,
    addCategories,
    load_EditCategories,
    editCategories,
    updateCategoryStatus,
    loadProducts,
    load_AddProducts,
    addProducts,
    load_EditProducts,
    editProducts,
    updateProductStatus
}   