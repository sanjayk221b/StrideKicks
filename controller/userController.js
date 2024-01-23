
const User = require('../model/userModel');
const Products = require('../model/productsModel');
const Categories = require('../model/categoriesModel');
const userOtp = require('../model/userOtpModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const randomString = require('randomstring');
const moment = require('moment');


//Register Verify
const verifyRegister = async (req, res) => {
    try {
        const { username, email, mobile, password, confirmPassword } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).render('register', { message: 'Email is already registered' })
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
                <P style="color: #007BFF;"></p>
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
        console.log('resend comment', email);
        setTimeout(async () => {
            await newOtpVerification.deleteOne({ email: email })
        }, 60000);
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
        res.render('otp', { message: 'otp expired', email: email })
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

const resendOtp = async (req, res) => {
    try {
        console.log('resendId :', req.body);
        const email = req.body.email
        // console.log("ivda ethi");

        // console.log(user);
        // Resend OTP Verification mail
        await sendOtpVerification({ email }, res);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });

        if (user) {
            if (!user.isBlocked && user.verified) {
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (passwordMatch) {
                    req.session.userId = user._id;
                    console.log('userID', req.session.userId);
                    res.redirect("/home");
                } else {
                    req.flash('message', 'Incorrect Password');
                    res.redirect("/login");
                }
            } else if (!user.verified) {
                req.flash('message', 'Email is not verified Register Again');
                await User.deleteOne({ verified: fals })
                res.redirect("/login");
            } else {
                req.flash('message', 'User doesn\'t Exist');
                res.redirect("/login");
            }
        } else {
            req.flash('message', 'User doesn\'t Exist');
            res.redirect("/login");
        }
    } catch (error) {
        console.log(error.message);
    }
}


//Add Address
const addAddress = async (req, res) => {
    try {
        const userId = req.session.userId;

        const { name, houseName, city, state, mobile, pincode, source } = req.body;

        await User.findOneAndUpdate({ _id: userId }, {
            $push: {
                address: {
                    name: name,
                    houseName: houseName,
                    city: city,
                    state: state,
                    mobile: mobile,
                    pincode: pincode
                }
            }
        });


        if (source === 'checkout') {
            res.redirect('/checkout');
        } else if (source === 'profile') {
            res.redirect('/manageAddress');
        } else {
            res.redirect('/home');
        }

    } catch (error) {
        console.log(error.message);
    }
};


//Edit Address
const editAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, name, houseName, city, state, mobile, pincode } = req.body;
        console.log('edit request recieved', req.body)
        await User.findOneAndUpdate(
            { _id: userId, "address._id": addressId },
            {
                $set: {
                    "address.$.name": name,
                    "address.$.houseName": houseName,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.mobile": mobile,
                    "address.$.pincode": pincode
                }
            }, { new: true }
        );

        res.redirect('/manageAddress');
    } catch (error) {
        console.log(error.message);
    }
};



// Delete Address
const deleteAddress = async (req, res) => {
    try {
        console.log('Delete Address request received id:', req.params);
        const userId = req.session.userId;
        const addressId = req.params.addressId;
        console.log('Delete Address userId:', userId);

        const result = await User.findOneAndUpdate({ _id: userId }, {
            $pull: {
                address: { _id: addressId }
            }
        }, { new: true });

        if (result) {
            console.log('Update Result:', result);
            return res.status(200).json({ message: "Address deleted successfully", user: result });
        } else {
            return res.status(404).json({ message: "Address not found" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



//Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { username, mobile } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    username,
                    mobile,
                },
            },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(updatedUser)
    } catch (error) {
        console.log(error);
    }
}

//updatePassword
const updatePassword = async (req, res) => {
    try {
        const user = await User.findById({ _id: req.session.userId });

        const { currentPassword, newPassword, confirmPassword } = req.body;

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            console.log('oldpassword do not match')
            return res.status(400).json({ success: false, message: 'Old password is incorrect.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        req.session.userId = null
        return res.status(200).json({ success: true, message: 'Password changed successfully.' });


    } catch (error) {
        console.log(error);
    }

}

//Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        console.log('userData in forgot password', userData);
        if (userData) {
            if (userData.verified !== true) {
                res.render('forgetPassword', { message: 'please verify your email' });
            } else {
                const randomToken = randomString.generate();
                const updatedUser = await User.updateOne({ email: email }, {
                    $set: {
                        token: randomToken
                    }
                })
                console.log('updated data ', updatedUser);
                setTimeout(async () => {
                    await User.updateOne({ email: email }, {
                        $unset: {
                            token: 1
                        }
                    });
                    console.log('Token deleted after 3 minutes');
                }, 180000);
                sendResetPasswordMail(userData.name, userData.email, randomToken);
                res.render('forgotPassword', { message: 'Please check your mail to reset password' })
                console.log('random token generated', randomToken);
            }
        } else {
            res.render('forgotPassword', { message: ' User email is incorrect' });
        }
    } catch (error) {
        console.log(error)
    }
}

//Reset Password SendEmail
const sendResetPasswordMail = async (name, email, token, res) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: true,
            requireTLS: true,
            auth: {
                user: process.env.email_user,
                pass: 'kxep rhia exxg wutl'
            }
        })
        // console.log('email reset password:', email);
        // console.log('from:', process.env.email_user);
        const mailOptions = {
            from: process.env.email_user,
            to: email,
            subject: 'For Reset Password',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #007BFF;">Reset Your Password</h2>
                <p>Please click here to <a href="http://localhost:3001/resetPassword?token=${token}">reset your password</a></p>
                <p>This Link is valid for a short period. Do not share it with anyone.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <P style="color: #007BFF;"></p>
            </div>
        `,
        }

        await transporter.sendMail(mailOptions);
        console.log('Reset Otp mail ', email);
        console.log(token);
    } catch (error) {
        console.log(error.message);
    }
}

//Reset Password
const resetPassword = async (req, res) => {
    try {
        console.log('reset password body', req.bod);
        const { newPassword, confirmPassword, userId } = req.body;
        const user = await User.findById({ _id: userId });

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
        } else {
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            user.password = hashedPassword;
            await user.save();

            return res.redirect('/login')
            // return res.status(200).json({ success: true, message: 'Password changed successfully.' });

        }
    } catch (error) {
        console.log(error);
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

//Load Shop
const loadShop = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId });

        const categoryId = req.query.categoryId;
        const page = parseInt(req.query.page) || 1;
        const perPage = 6;
        const searchQuery = req.query.search || '';
        const sortType = req.query.sort || 'low-to-high';

        const conditions = { isListed: true };
        if (categoryId) {
            conditions.category = categoryId;
        }
        if (searchQuery) {
            conditions.name = { $regex: searchQuery, $options: 'i' };
        }

        let sortOption = {};
        if (sortType === 'low-to-high') {
            sortOption = { price: 1 }; // Ascending order
        } else if (sortType === 'high-to-low') {
            sortOption = { price: -1 }; // Descending order
        }

        const totalProducts = await Products.countDocuments(conditions);
        const totalPages = Math.ceil(totalProducts / perPage);
        const hasPreviousPage = page > 1;
        const hasNextPage = page < totalPages;

        const products = await Products.find(conditions)
            .sort(sortOption)
            .skip((page - 1) * perPage)
            .limit(perPage);

        const categoryData = await Categories.find({ isListed: true });

        res.render('shop', {
            products,
            categories: categoryData,
            user: userData,
            currentPage: page,
            totalPages,
            hasPreviousPage,
            hasNextPage,
            searchQuery,
            sortType,
            categoryId: categoryId || '', 
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};





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

const load_AddAddress = async (req, res) => {
    try {
        const source = req.query.source;
        console.log(source);
        const userData = await User.findOne({ _id: req.session.userId });
        res.render('addAddress', { user: userData, source: source });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


const load_EditAddress = async (req, res) => {
    try {
        const { addressId } = req.query;
        const userId = req.session.userId;

        const user = await User.findOne({ _id: userId });
        const selectedAddress = user.address.find((address) => address._id.toString() === addressId);

        if (!selectedAddress) {
            return res.status(404).send('Address not found');
        }

        console.log('Edit address:', selectedAddress);
        res.render('editAddress', { address: [selectedAddress] });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



const loadProfile = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId });
        res.render('profile', { user: userData })
    } catch (error) {
        console.log(error);
    }
}

const load_EditProfile = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        res.render('editProfile', { user: userData });
    } catch (error) {
        console.log(error);
    }
}



const load_manageAddress = async (req, res) => {
    try {

        const userData = await User.findOne({ _id: req.session.userId })
        res.render('manageAddress', { user: userData })
    } catch (error) {
        console.log(error);
    }
}

const load_Wallet = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        res.render('wallet', { user: userData, moment })
    } catch (error) {
        console.log(error)
    }
}


const load_forgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword')
    } catch (error) {
        console.log(error);
    }
}


//load Reset Password
const load_resetPassword = async (req, res) => {
    try {
        const token = req.query.token;
        console.log('token  load_ResetPassword', token);
        const tokenData = await User.findOne({ token: token })
        if (tokenData) {
            res.render('resetPassword', { userId: tokenData._id });
        } else {
            res.render('error404', { message: 'token is invalid' })
        }

    } catch (error) {
        console.log(error);
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

const error403 = async (req, res) => {
    try {
        res.render('error403')
    } catch (error) {
        console.log(error);
    }
}
const error404 = async (req, res) => {
    try {
        res.render('error404')
    } catch (error) {
        console.log(error);
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
    logoutUser,
    resendOtp,
    error403,
    error404,
    load_AddAddress,
    loadProfile,
    addAddress,
    load_EditAddress,
    editAddress,
    deleteAddress,
    load_EditProfile,
    load_manageAddress,
    updateUserProfile,
    updatePassword,
    load_forgotPassword,
    forgotPassword,
    sendResetPasswordMail,
    load_resetPassword,
    resetPassword,
    load_Wallet
}