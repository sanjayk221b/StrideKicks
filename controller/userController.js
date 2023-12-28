
const User = require('../model/userModel');
const Products = require('../model/productsModel');
const Categories = require('../model/categoriesModel')
const userOtp = require('../model/userOtpModel')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const dotenv = require('dotenv');
dotenv.config()


//Register Verify
const verifyRegister = async (req, res) => {
    try {
        const { username, email, mobile, password, confirmPassword } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).render('register',{message:'Email is already registered'})
        }

        if (password !== confirmPassword) {
            return res.status(400).send({ error: "Passwords do not match" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            email,
            mobile,
            password: hashedPassword,
            verified: false,
            isAdmin: 0
        });

        await newUser.save();
        sendOtpVerification(newUser, res);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal server error" });
    }
};


// Otp verification
const sendOtpVerification = async ({ email }, res) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: true,
            auth: {
                user: process.env.email_user,
                pass: 'kxep rhia exxg wutl'
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`
        console.log('email:', email);
        console.log('from:', process.env.email_user);
        const mailOptions = {
            from: process.env.email_user,
            to: email,
            subject: 'verify your email',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #007BFF;">Verify Your Email</h2>
                <p>Please use the following OTP to verify your email:</p>
                <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #007BFF;">${otp}</h3>
                </div>
                <p>This OTP is valid for a short period. Do not share it with anyone.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <P style="color: #007BFF;">From Vogue Vista </p>
            </div>
        `,
        }
        //hash otp
        const saltrounds = 10;
        const hashedOtp = await bcrypt.hash(otp, saltrounds);
        const newOtpVerification = await new userOtp({
            email: email,
            otp: hashedOtp,
            createdAt: new Date()
        })
        //save otp record
        await newOtpVerification.save();
        await transporter.sendMail(mailOptions);
        res.redirect(`/otp?email=${email}`)
    } catch (error) {
        console.log(error.message);
    }
}

// Otp verification
const verifyOtp = async (req, res) => {
    const email = req.body.email;
    // console.log('email: ', req.body.email);
    const otp = req.body.one + req.body.two + req.body.three + req.body.four;
    // console.log('otp: ', otp);
    const user = await userOtp.findOne({ email: email });
    console.log('user: ', user);


    if (!user) {
        res.render('otp', { message: 'otp expired' })
        return;
    }
    const { otp: hashedOtp } = user;
    const validOtp = await bcrypt.compare(otp, hashedOtp);
    console.log(validOtp);


    if (validOtp == true) {
        const userData = await User.findOne({ email: email })
        await User.findByIdAndUpdate({ _id: userData._id }, { $set: { verified: true } });
        await userOtp.deleteOne({ email: email });

        req.session.userId = userData._id

        res.redirect('/home');
    } else {
        // res.render('otp', { email: email, message: 'otp is incorrect' })
        req.flash('message', 'Incorrect OTP');
        res.redirect(`/otp?email=${email}`)
    }
}

//Login verification
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });

        if (user && !user.isBlocked) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                req.session.userId = user._id;
                console.log('userID', req.session.userId);

                res.redirect("/home");
            } else {
                req.flash('message', 'Incorrect Password');
                res.redirect("/login");
            }
        } else {
            req.flash('message', 'User doesn\'t exist');
            res.redirect("/login");
        }
    } catch (error) {
        console.log(error.message);
    }
}


//Home Render
const loadHome = async (req, res) => {
    try {
        // console.log('User ID from session:', req.session.userId);
        const userData = await User.findOne({ _id: req.session.userId });
        // console.log('User Data:', userData);
        res.render('home', { user: userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


//Login Page Render
const loadLogin = async (req, res) => {
    try {

        res.render('login');
    } catch {
        console.log(error.message);
    }
}

//Login Otp render
const loadOtp = async (req, res) => {
    try {
        const email = req.query.email
        res.render('otp', { email: email });
    } catch {
        console.log(error.message);
    }
}

// Register Render
const loadRegister = async (req, res) => {
    try {
        res.render('register')
    } catch {
        console.log(error.message);
    }
}
//load Shop
const loadShop = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId });
        const categoryId = req.query.categoryId
        if (categoryId) {
            data = await Products.find({ isListed: true, category: categoryId })
        } else {
            data = await Products.find({ isListed: true })
        }

        const categoryData = await Categories.find({ isListed: true })

        res.render('shop', { products: data, categories: categoryData, user: userData })

    } catch (error) {
        console.log(error);
    }
}

// load product details
const loadProductDetails = async (req, res) => {
    try {
        const id = req.query.id
        const userData = await User.findOne({ _id: req.session.userId });
        const products = await Products.findOne({ _id: id })
        res.render('productDetails', { products: products, user: userData })
    } catch (error) {
        console.log(error)
    }
}

//logout user
const logoutUser = async (req, res) => {
    try {
        req.session.userId = null
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadHome,
    loadLogin,
    loadRegister,
    loadOtp,
    verifyRegister,
    verifyOtp,
    verifyLogin,
    loadShop,
    loadProductDetails,
    logoutUser
}