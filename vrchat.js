var mysql = require('mysql');
var express = require('express');
var app = express();
var http = require('http');
var url = require('url');
var fileUpload = require('express-fileupload');
var multipart = require('connect-multiparty');
var path = require('path');
var Request = require("request");
//var busboy = require("then-busboy");


var con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345',
	database: 'vrchat'
});
con.connect(function (err) {
	if (err) {
		console.log("Error in connecting DB" + err);
		return;
	}

	console.log("Connection Estabilished");

});

app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	// Pass to next layer of middleware
	next();
});
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));


app.listen(8000);
console.log("Sever Listen 8000");





// Mobile No check
var Userdata;
app.get('/MobileNoCheck', function (req, res) {
	var MobileNo = req.query.MobileNo;
	con.query("SELECT * FROM `profile` WHERE MobileNo='" + MobileNo + "' ", function (err, result) {
		if (err) {
			throw err;
		} else if (res.statusCode === 200) {
			// To send OTP to Mobiles
			Userdata = result;
			var OTP = Math.floor(1000 + Math.random() * 900000);
			Request.get(`http://minesmsapi.000webhostapp.com/?uid=9791329930&pwd=9791329930&phone=${MobileNo}&msg=Your otp is ${OTP}. Please do not share it with anybody.`, (error, response, body) => {
				if (error) {
					return console.dir(error);
				} else {
					con.query("INSERT INTO `otp`( `MobileNo`, `OTP`, `Validtill`, `Createddate`) VALUES ( '" + MobileNo + "','" + OTP + "',CURRENT_TIMESTAMP+INTERVAL 59 MINUTE_SECOND ,CURRENT_TIMESTAMP)", function (err, response) {
						if (err) {
							throw err;
						} else {
							res.json({
								StatusCode: res.statusCode,
								Message: "OTP Sent successfully.",
								OTP: OTP
							});
						}
					}); 
				} 
			});
		} else {
			res.json({
				StatusCode: res.statusCode,
				Message: res.statusMessage
			});
		}
	});
});

app.get("/OTPcheck", function (req, res) {
	var OTP = req.query.OTP;
	var MobileNo = req.query.MobileNo;
	con.query("SELECT * FROM `otp` WHERE MobileNo='" + MobileNo + "' AND Validtill >= CURRENT_TIMESTAMP ", function (err, result) {
		if (err) {
			throw err;
		} else if (result.length > 0) {
			if (result[0].OTP === +OTP) {
				if (Userdata.length > 0) {
					res.json({
						StatusCode: res.statusCode,
						Message: "OTP Verified successfully.",
						Response: Userdata,
						NewUser: false
					});
				} else {
					res.json({
						StatusCode: res.statusCode,
						Message: "OTP Verified successfully.",
						NewUser: true
					});
				}

			} else {
				res.json({
					StatusCode: 404,
					Message: "Please Enter Valid OTP.",
				});
			}
		} else {
			res.json({
				StatusCode: 404,
				Message: "OTP Expired."
			});
		}
	});
});


app.get('/registeruser', function (req, res) {
	var Name = req.query.Name;
	var MobileNo = req.query.MobileNo;
	con.query('INSERT INTO `profile`( `MobileNo`, `Name` ) VALUES ("' + MobileNo + '","' + Name + '" )', function (err, result) {
		if (err) {
			throw err;
		} else if (res.statusCode === 200) {
			res.json({
				StatusCode: 200,
				Message: "User Register Successfully.",
				Response: result
			});
		} else {
			res.json({
				StatusCode: res.statusCode,
				Message: res.statusMessage
			});
		}
	});

});