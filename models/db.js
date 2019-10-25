const mongoose = require('mongoose');

const uri =
  'mongodb+srv://admin:272650330@cluster0-mfb41.mongodb.net/RESTful?retryWrites=true'; //'mongodb://localhost:27017/QuanLyBanHang'

mongoose.connect(uri, { useNewUrlParser: true }, err => {
  if (!err) {
    console.log('MongoDB Connection Succeeded.');
  } else {
    console.log('Error in DB connection : ' + err);
  }
});

require('./user.model');
