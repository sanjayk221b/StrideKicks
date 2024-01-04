const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const userRouter = require('./routes/userRoute');
const adminRouter = require('./routes/adminRoute');
const session = require('express-session')
const flash = require('express-flash')


         
//Database connection
mongoose.connect(process.env.MONGO_URI);                                                     
            
const PORT = process.env.PORT || 8080
     
//middleware                 
app.use(express.json());     
app.use(express.urlencoded({ extended: true }));                                            
                     
//session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));    
    

//clear cache
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");                    
    res.setHeader("Pragma", "no-cache"); 
    res.setHeader("Expires", "0");
    next()
});                   
                
app.use(flash())
   
     
//load UserAssets        
app.use(express.static(path.resolve(__dirname, 'public')))     

app.use('/css', express.static(path.resolve(__dirname, 'public/userAssets/css')));                                                                        
app.use('/img', express.static(path.resolve(__dirname, 'public/UserAssets/img')));                      
app.use('/js', express.static(path.resolve(__dirname, 'public/userAssets/js')));                          
   
//load routers          
app.use('/', userRouter);
app.use('/admin', adminRouter);      
   
       

app.listen(PORT, () => {     
    console.log(`Server is listening at http://localhost:${PORT}/`);
})                                                                                                                     