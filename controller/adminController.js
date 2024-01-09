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
            req.session.admin = email
            res.redirect('/admin')
        } else {
            // Check for incorrect email or password and flash corresponding messages
            if (admin_email !== email) {
                req.flash('message', 'Incorrect Email');
            } else {
                req.flash('message', 'Incorrect Password');
            }
            res.redirect('/admin/login');
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
        const sessionId = req.session.userId; 

        if (!userData) {
            return res.status(404).send('User not found');
        }

        let updatedUser;

        if (userData.isBlocked) {
            updatedUser = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true });
        } else {
            updatedUser = await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });
        }

        return res.send({ status: 'success', user: updatedUser });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}


//Add New Categories
const addCategories = async (req, res) => {
    try {
        const categoryName = req.body.name.toUpperCase(); // Convert to lowercase

        const categoryExist = await Categories.findOne({ name: { $regex: new RegExp('^' + categoryName + '$', 'i') } });

        if (categoryExist) {
            // Category already exists, handle accordingly
            req.flash('message', 'Category already exists');
            res.redirect('/admin/addCategories');
        } else {
            const categories = new Categories({
                name: categoryName, // Save the lowercase version
                description: req.body.description
            });

            await categories.save();
            res.redirect('/admin/categories');
        }
    } catch (error) {
        console.log(error.message);
        // Handle the error appropriately, maybe send an error response
        res.status(500).send('Internal Server Error');
    }
};

// Edit Categories
const editCategories = async (req, res) => {
    try {
        console.log(req.body);
        const categoryName = req.body.categoryName.toUpperCase(); 

        const categoryExist = await Categories.findOne({
            _id: { $ne: req.body.id }, // Exclude the current category
            name: { $regex: new RegExp('^' + categoryName + '$', 'i') }
        });

        if (categoryExist) {
            req.flash('message', 'Category name already in use');
            res.redirect(`/admin/editCategories?categoryId=${req.body.id}`);
        } else {
            // Update the category details
            await Categories.findByIdAndUpdate(req.body.id, {
                name: categoryName,
                description: req.body.description
            });

            res.redirect('/admin/categories');
        }
    } catch (error) {
        console.log(error.message);
        // Handle the error appropriately, maybe send an error response
        res.status(500).send('Internal Server Error');
    }
};


const deleteCategories = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryExist = await Categories.findById(categoryId);

        if (!categoryExist) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await Categories.findByIdAndDelete(categoryId);

        // Send a JSON response indicating success
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};





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



//logout admin
const logoutAdmin = async (req, res) => {
    try {
        req.session.admin = null
        res.redirect("/admin/login");
    } catch (error) {
        console.log(error.message);
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
    deleteCategories,
    logoutAdmin,
}   