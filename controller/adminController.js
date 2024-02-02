const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const User = require('../model/userModel');
const Categories = require('../model/categoriesModel');
const Products = require('../model/productsModel');
const Orders = require('../model/ordersModel');
const Offers = require('../model/offersModel');
const moment = require('moment');
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
        const ordersCount = await Orders.countDocuments({ status: { $ne: "Pending" } });
        const productsCount = await Products.countDocuments();
        const categoriesCount = await Categories.countDocuments();
        const currentYear = new Date().getFullYear();
        const latestUsers = await User.find({}).sort({ createdAt: -1 }).limit(5);

        // Total Revenue with Discount Subtraction
        const totalRevenue = await Orders.aggregate([
            {
                $unwind: "$items"
            },
            {
                $match: {
                    $and: [
                        { "items.orderStatus": "delivered" },
                        { status: { $ne: "pending" } },
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $subtract: ["$items.totalPrice", "$items.discountPerItem"] } }
                }
            }
        ]);

        // Current Month Revenue 
        const currentMonth = new Date().getMonth() + 1; // Get the current month (1-indexed)

        const currentMonthRevenue = await Orders.aggregate([
            {
                $unwind: "$items"
            },
            {
                $match: {
                    $and: [
                        { "items.orderStatus": "delivered" },
                        { status: { $ne: "pending" } },
                        { date: { $gte: new Date(currentYear, currentMonth - 1, 1), $lt: new Date(currentYear, currentMonth, 1) } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $subtract: ["$items.totalPrice", "$items.discountPerItem"] } }
                }
            }
        ]);

        const currentMonthTotalRevenue = currentMonthRevenue.length > 0 ? currentMonthRevenue[0].totalRevenue : 0;


        // Monthly Data for the current year
        const monthlyData = await Orders.aggregate([
            {
                $unwind: "$items"
            },
            {
                $match: {
                    $and: [
                        { "items.orderStatus": "delivered" },
                        { status: { $ne: "pending" } },
                        { date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) } }
                    ]
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$date" } },
                    totalRevenue: { $sum: { $subtract: ["$items.totalPrice", "$items.discountPerItem"] } },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 } // Sort by month
            }
        ]);

        // Separate monthlyOrders and monthlyRevenue
        const monthlyOrders = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyData.find(data => data._id.month === i + 1);
            return {
                totalOrders: monthData ? monthData.totalOrders : 0
            };
        });

        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyData.find(data => data._id.month === i + 1);
            return {
                totalRevenue: monthData ? monthData.totalRevenue : 0
            };
        });

        const monthlyRevenueByCategory = await Orders.aggregate([
            {
                $unwind: "$items"
            },
            {
                $match: {
                    $and: [
                        { "items.orderStatus": "delivered" },
                        { status: { $ne: "pending" } },
                        { date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        category: "$product.category"
                    },
                    totalRevenue: { $sum: { $subtract: ["$items.totalPrice", "$items.discountPerItem"] } },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1, "_id.category": 1 } // Sort by month and category
            }
        ]);

        // Create separate arrays for men and women with 0 values for months with no orders
        const mensMonthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const mensData = monthlyRevenueByCategory.find(data => data._id.month === i + 1 && data._id.category === "MENS");
            return {
                totalRevenue: mensData ? mensData.totalRevenue : 0
            };
        });

        const womensMonthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const womensData = monthlyRevenueByCategory.find(data => data._id.month === i + 1 && data._id.category === "WOMENS");
            return {
                totalRevenue: womensData ? womensData.totalRevenue : 0
            };
        });

        console.log("mensMonthlyRevenue", mensMonthlyRevenue);
        console.log("womensMonthlyRevenue", womensMonthlyRevenue);




        // Monthly User Data for the current year
        const monthlyUserData = await User.aggregate([
            {
                $match: {
                    "createdAt": {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    totalUsers: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 } // Sort by month
            }
        ]);

        //  MonthlyUsers
        const monthlyUsers = Array.from({ length: 12 }, (_, i) => {
            const monthUserData = monthlyUserData.find(data => data._id.month === i + 1);
            return {
                totalUsers: monthUserData ? monthUserData.totalUsers : 0
            };
        });

        // Yearly Data For Current Year
        const yearlyData = await Orders.aggregate([
            {
                $unwind: "$items"
            },
            {
                $match: {
                    $and: [
                        { "items.orderStatus": "delivered" },
                        { status: { $ne: "pending" } },
                        { date: { $gte: new Date(2018, 0, 1), $lt: new Date(2025, 0, 1) } }
                    ]
                }
            },
            {
                $group: {
                    _id: { year: { $year: "$date" } },
                    totalRevenue: { $sum: { $subtract: ["$items.totalPrice", "$items.discountPerItem"] } },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1 } // Sort by year
            }
        ]);

        // Separate yearlyOrders and yearlyRevenue with zeros for missing years
        const yearsFrom2018 = Array.from({ length: 7 }, (_, i) => 2018 + i);
        const yearlyOrders = yearsFrom2018.map(year => {
            const yearData = yearlyData.find(data => data._id.year === year);
            return {
                totalOrders: yearData ? yearData.totalOrders : 0,
                year
            };
        });

        const yearlyRevenue = yearsFrom2018.map(year => {
            const yearData = yearlyData.find(data => data._id.year === year);
            return {
                totalRevenue: yearData ? yearData.totalRevenue : 0,
                year
            };
        });
        // Yearly User Data for the current year
        const yearlyUserData = await User.aggregate([
            {
                $match: {
                    "createdAt": {
                        $gte: new Date(2018, 0, 1),
                        $lt: new Date(2025, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { year: { $year: "$createdAt" } },
                    totalUsers: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1 } // Sort by year
            }
        ]);

        // Separate yearlyUsers 
        const yearlyUsers = yearsFrom2018.map(year => {
            const yearUserData = yearlyUserData.find(data => data._id.year === year);
            return {
                totalUsers: yearUserData ? yearUserData.totalUsers : 0,
                year
            };
        });

        //Latest Orders
        const latestOrders = await Orders.aggregate([
            {
                $unwind: "$items",
            },
            {
                $match: {
                    status: { $ne: "Pending" },
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
            {
                $limit: 10,
            },
        ]);


        res.render('dashboard', {
            ordersCount,
            productsCount,
            categoriesCount,
            totalRevenue: totalRevenue[0].totalRevenue,
            currentMonthRevenue: currentMonthTotalRevenue,
            monthlyRevenue,
            monthlyOrders,
            monthlyUsers,
            yearlyOrders,
            yearlyRevenue,
            yearlyUsers,
            latestUsers,
            latestOrders,
            mensMonthlyRevenue,
            womensMonthlyRevenue
        });
    } catch (error) {
        console.log(error.message);
    }
};


//Load users 
const loadUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.render('users', { users: users });
    } catch (error) {
        console.log(error.message);
    }
}


//load Categories
const loadCategories = async (req, res) => {
    try {
        const categories = await Categories.find({});
        const offers = await Offers.find({});
        res.render('categories', { categories, offers, moment });
    } catch (error) {
        console.log(error.message);
    }
}

//Load Add Categories
const load_AddCategories = async (req, res) => {
    try {
        res.render('addCategories');
    } catch (error) {
        console.log(error.message);
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

// Load Sales Report
const load_salesReport = async (req, res) => {
    try {
        const orders = await Orders.find({ "items.orderStatus": "delivered" })
            .populate('userId') // Populate user data
            .populate('items.productId'); // Populate product data

        res.render('salesReport', { orders, moment });
    } catch (error) {
        console.error(error); // Log the error
        res.status(500).send('Internal Server Error');
    }
}

//Date Picker 
const datePicker = async (req, res) => {
    try {
        console.log('datepicker req body', req.body)
        const { startDate, endDate } = req.body;
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);

        const selectedDate = await Orders.find({
            createdAt: {
                $gte: startDateObj,
                $lte: endDateObj,
            },
            "items.orderStatus": "delivered",
        })
            .populate('userId') // Populate user reference
            .populate('items.productId'); // Populate product reference in items


        console.log('selectedDate order', selectedDate);

        res.status(200).json({ orders: selectedDate });
    } catch (err) {
        res.redirect("/500");
    }
};





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
    load_salesReport,
    datePicker,

}   