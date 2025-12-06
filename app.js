require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rfpRoutes = require('./routes/rfp');
const vendorRoutes = require('./routes/vendor');
const imapReceiver = require('./services/imapReceiver');
const proposalRoutes = require('./routes/proposals');


const app = express();
const PORT = process.env.PORT || 3000;

//cors handling
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});


app.use(express.json());
app.use('/rfp', rfpRoutes);
app.use('/vendor', vendorRoutes);
app.use('/proposals', proposalRoutes);

mongoose.connect(process.env.DB_URL)
    .then(() => {
        console.log('MongoDB connected')
        app.listen(PORT, ()=> console.log(`Server running on ${PORT}`))
        })
    .catch(err => console.log(err));



imapReceiver.start();
