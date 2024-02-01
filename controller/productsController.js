const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const User = require('../model/userModel');
const Categories = require('../model/categoriesModel');
const Products = require('../model/productsModel');
const Offers = require('../model/offersModel');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const moment = require('moment')

//Add Products
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
//List/ Unlist Product
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
// Edit Product
const editProducts = async (req, res) => {
    try {
        const { id, name, description, price, category, quantity } = req.body;

        const data = await Products.findOne({ isListed: true });
        const categories = await Categories.find({ isListed: true });

        // Check if a new image is uploaded
        let imageData = [];
        if (req.files) {
            const existingImages = (await Products.findById(id)).image || [];

            for (let i = 0; i < req.files.length; i++) {
                if (existingImages.length + i < 4) {
                    const resizedPath = path.join(__dirname, '../public/sharpImages', req.files[i].filename);

                    // Resize image using sharp
                    await sharp(req.files[i].path)
                        .resize(800, 1200, { fit: 'fill' })
                        .toFile(resizedPath);

                    // Push the resized filename to the array
                    imageData.push(req.files[i].filename);
                } else {
                    req.flash('message', 'Only 4 images are allowed.');
                    return res.redirect(`/admin/editProducts/${id}`);
                }
            }

            // Append newly added images to the existing ones
            imageData = existingImages.concat(imageData);

            // Validate the total number of images
            if (imageData.length !== 4) {
                req.flash('message', 'Exactly 4 images are required.');
                return res.redirect(`/admin/editProducts/${id}`);
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
                $set: { image: imageData.length > 0 ? imageData : undefined },
            },
            { new: true }
        );

        res.redirect(`/admin/products`);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};




//Delete Single Image
const deleteImage = async (req, res) => {
    try {
        const { img, productId } = req.body;
        console.log("Delete request received:", img, productId);
        console.log(req.body);

        fs.unlink(path.join(__dirname, "../public/sharpImages", img), () => { });
        await Products.updateOne(
            { _id: productId },
            { $pull: { image: img } }
        );
        res.send({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ success: false, error: error.message });
    }
};

//Delete Product
const deleteProducts = async (req, res) => {
    try {
        const productId = req.params.productId;

        await Products.deleteOne({ _id: productId });

        res.json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

//Load Products
const loadProducts = async (req, res) => {
    try {
        const products = await Products.find({});
        const offers = await Offers.find({});
        res.render('products', { products, offers, moment });
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
        // console.log(id);
        const productData = await Products.findOne({ _id: id });
        const categoryData = await Categories.find({ isListed: true })
        // console.log(productData);
        // console.log(categoryData);
        res.render('editProducts', { products: productData, categories: categoryData })
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    loadProducts,
    load_AddProducts,
    load_EditProducts,
    addProducts,
    updateProductStatus,
    editProducts,
    deleteProducts,
    deleteImage
}