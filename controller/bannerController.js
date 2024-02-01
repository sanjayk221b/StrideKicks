const Banner = require('../model/bannerModel');
const path = require('path');
const sharp = require('sharp');


//Load Banner
const loadBanner = async (req, res) => {
    try {
        const banners = await Banner.find({});
        res.render('banner', { banners });
    } catch (error) {
        console.log(error)
        return res.status(500);
    }
}

//Load Add Banner 
const load_AddBanner = async (req, res) => {
    try {
        res.render('addBanner');
    } catch (error) {
        console.log(error);
        return res.status(500)
    }
}

//Add Banner 
const addBanner = async (req, res) => {
    try {
        console.log("add banner request body:", req.body);
        console.log("req.files", req.files)
        const { title, description, occassion, status } = req.body; // Update this line

        const existingBanner = await Banner.findOne({ title: title });
        if (existingBanner) {
            return res.status(400).json({ existingBannerError: 'Banner Already Exist' });
        } else {
            const imageArray = [];
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const filePath = path.join(__dirname, '../public/sharpImages', req.files[i].filename);
                    await sharp(req.files[i].path)
                        .resize({ width: 635, height: 380 })
                        .toFile(filePath);
                    imageArray.push(req.files[i].filename);
                }
            }
            const banner = new Banner({
                title,
                description,
                occassion, // Update this line
                image: imageArray,
            });
            await banner.save();
            res.redirect("/admin/banner");
        }
    } catch (error) {
        console.log(error);
        return res.status(500);
    }
}

//Load Edit Banner
const load_EditBanner = async (req, res) => {
    try {
        const { bannerId } = req.query;
        const banner = await Banner.findOne({ _id: bannerId });
        res.render('editBanner', { banner });
    } catch (error) {
        console.log(error);
        return res.status(500);
    }
}

//Edit Banner 
const editBanner = async (req, res) => {
    try {
        console.log("edit banner request body:", req.body);
        console.log("req.files", req.files);

        const { bannerId, title, description, occassion } = req.body;

        console.log("Received bannerId:", bannerId);

        
        const banner = await Banner.findById(bannerId);

        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        banner.title = title;
        banner.description = description;
        banner.occassion = occassion; 

        if (req.files && req.files.length > 0) {
            const imageArray = [];

            for (let i = 0; i < req.files.length; i++) {
                const filePath = path.join(__dirname, '../public/sharpImages', req.files[i].filename);

                await sharp(req.files[i].path)
                    .resize({ width: 635, height: 380 })
                    .toFile(filePath);

                imageArray.push(req.files[i].filename);
            }

            banner.image = imageArray;
        }

        await banner.save();
        res.redirect("/admin/banner");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


//Delete Banner
const deleteBanner = async (req, res) => {
    try {
        console.log("delete banner req query", req.query)
        const { bannerId } = req.query;
        await Banner.findByIdAndDelete(bannerId);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        return res.status(500);
    }
}

module.exports = {
    loadBanner,
    load_AddBanner,
    addBanner,
    load_EditBanner,
    editBanner,
    deleteBanner
}