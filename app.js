#!/usr/bin/env node

//import modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
const engine = require('ejs-locals');
const crypto = require('crypto');
const moment = require('moment');
const fileUpload = require('express-fileupload');
const tools = require('./javascripts/tools');

//configure mongodb connection
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb+srv://yc9841:chen2yu3tao1@yc001-0ofxw.azure.mongodb.net/test?retryWrites=true&w=majority');

//set up mongodb connection
const db = mongoose.connection;
db.on('error', console.log.bind(console, "connection error")); 
db.once('open', function() {
    console.log("Connection succeeded.");
});

//express app instance
const app = express();

//configure express app
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'coursework is hell',
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));
app.use(fileUpload({
	limits: {fileSize: 4 * 1024 * 1024}
}));

//set view engine as 'ejs-locals'
app.engine('ejs', engine);
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');

//handle edit photo request
app.post('/photo_edit', function(req, res) {

	if (req.files.profile_photo_edit) {
		db.collection("Accounts").updateOne({email: req.session.userID},
			{$set: {profile_photo: {data: Buffer.from(req.files.profile_photo_edit.data).toString('base64'),
						content_type: req.files.profile_photo_edit.mimetype}
				}}, function(err) {
				if (err) throw err;
			});
	}
	if (req.files.showcase_photo_edit) {
		db.collection("Accounts").updateOne({email: req.session.userID},
			{$set: {showcase_photo: {data: Buffer.from(req.files.showcase_photo_edit.data).toString('base64'),
						content_type: req.files.showcase_photo_edit.mimetype}
				}}, function(err) {
				if (err) throw err;
			});
	}
	console.log('Photos update successful');
	res.redirect('/personal_info');
});


//handle edit personal info request
app.post('/personal_info_edit', function(req, res) {

	db.collection("Accounts").updateOne({email: req.session.userID},
		{$set: {first_name: req.body.first_name_edit,
				last_name: req.body.last_name_edit,
				gender: req.body.gender_edit,
				birthday: req.body.birthday_edit,
				country: req.body.country_edit,
				city: req.body.city_edit,
				job: req.body.job_edit,
				sexual_orientation: req.body.sexual_orientation_edit,
				phone: req.body.phone_edit,
				personal_description: req.body.personal_description_edit,
				facebook_link: req.body.facebook_link_edit
			}}, function(err) {
			if (err) throw err;
		});
	console.log('Personal info edit successful');
	res.redirect('/personal_info');
});

//render personal info edit page
app.get('/personal_info_edit_page', function(req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		//add more needed info here
		res.render('personal_info_edit_page', {
			title: 'Personal info_edit_page',
			first_name: result.first_name,
			last_name: result.last_name,
			gender: result.gender,
			birthday: result.birthday,
			today: moment().format('YYYY-MM-DD'),
			country: result.country,
			city: result.city,
			job: result.job,
			sexual_orientation: result.sexual_orientation,
			phone: result.phone,
			personal_description: result.personal_description,
			facebook_link: result.facebook_link,
			profile_photo_content_type: result.profile_photo.content_type,
			profile_photo: result.profile_photo.data,
			showcase_photo_content_type: result.showcase_photo.content_type,
			showcase_photo: result.showcase_photo.data
		});
	});
});

//handle delete account request
app.get('/delete_account', function(req, res) {
	db.collection('Accounts').deleteOne({email: req.session.userID}, function(err) {
		if (err) throw err;
	});
	console.log('Account delete successful');
	res.redirect('/');
});

//render account delete confirm page
app.get('/delete_account_confirm', function (req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		//add more needed info here
		res.render('delete_account_confirm', {
			title: 'Confirm before you go',
			profile_photo_content_type: result.profile_photo.content_type,
			profile_photo: result.profile_photo.data
		});
	});
});

//handle password changing request
app.post('/change_password', function(req, res) {

	let password = req.body.password_change;
	password = crypto.createHmac('sha1', password).update(password).digest('hex');

	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		//add more needed info here
		if (password === result.password) {
			res.render('change_password_result',
				{title: 'Password change failed!',
					message: 'Please use different password.',
					button_action: 'javascript:history.back()',
					button_value: 'Return',
					profile_photo_content_type: result.profile_photo.content_type,
					profile_photo: result.profile_photo.data
				});
			console.log("Same password, failed to commit");
		} else {
			db.collection("Accounts").updateOne({email: req.session.userID},
				{$set: {password: password}}, function(err) {
				if (err) throw err;
			});
			res.render('change_password_result',
				{title: 'Password change successful!',
					message: 'Please re-login to your account.',
					button_action: '/logout',
					button_value: 'Logout',
					profile_photo_content_type: result.profile_photo.content_type,
					profile_photo: result.profile_photo.data
				});
			console.log("Password change successful");
		}
	});
});

//render password changing page
app.get('/change_password_page', function(req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		//add more needed info here
		res.render('change_password_page', {
			title: 'Change password',
			profile_photo_content_type: result.profile_photo.content_type,
			profile_photo: result.profile_photo.data
		});
	});
});

//fetch account info and render page
app.get('/account_info', function(req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		//add more needed info here
		res.render('account_info', {
			title: 'Account info',
			userID: req.session.userID,
			profile_photo_content_type: result.profile_photo.content_type,
			profile_photo: result.profile_photo.data
		});
	});
});

//fetch personal info and render page
app.get('/personal_info', function(req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		//add more needed info here
		res.render('personal_info', {
			title: 'Personal info',
			first_name: result.first_name,
			last_name: result.last_name,
			gender: result.gender,
			age: tools.getAge(result.birthday),
			birthday: result.birthday,
			country: result.country,
			city: result.city,
			job: result.job,
			sexual_orientation: result.sexual_orientation,
			phone: result.phone,
			personal_description: result.personal_description,
			facebook_link: result.facebook_link,
			profile_photo_content_type: result.profile_photo.content_type,
			profile_photo: result.profile_photo.data,
			showcase_photo_content_type: result.showcase_photo.content_type,
			showcase_photo: result.showcase_photo.data
		});
	});
});

//handle logout request
app.get('/logout', function(req, res) {
	req.session.destroy();
	console.log('Logout successful');
	res.redirect('/');
});

//render main page
app.get('/start_friendship', function(req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		res.render('start_friendship', {
			title: 'GlobalPal',
			user_name: result.first_name,
			profile_photo_content_type: result.profile_photo.content_type,
			profile_photo: result.profile_photo.data});
	});
});

//handle login request
app.post('/login', function(req, res) {

	let email = req.body.email_login;
	let password = req.body.password_login;

	db.collection('Accounts').findOne({email: email}, function (err, result) {
		if (err) throw err;
		if (!result) {
			console.log("Account doesn't exists");
			res.render('login_failed', {title: 'Login failed', error_message: "Account doesn't exists!"});
		} else {
			password = crypto.createHmac('sha1', password).update(password).digest('hex');
			if (result.password !== password) {
				console.log("Password incorrect");
				res.render('login_failed', {title: 'Login failed', error_message: "Password incorrect!"});
			} else {
				req.session.userID = email;
				console.log("Login successful");
				console.log("userID: " + req.session.userID);
				res.render('start_friendship', {
					title: 'GlobalPal',
					user_name: result.first_name,
					profile_photo_content_type: result.profile_photo.content_type,
					profile_photo: result.profile_photo.data});
			}
		}
	});
});

//render login page
app.get('/login_page', function(req, res) {
	res.render('login_page', {title: 'Login'});
});

//handle signup request
app.post('/signup', function(req, res) {

	let first_name = req.body.first_name_signup;
	let last_name = req.body.last_name_signup;
	let email = req.body.email_signup;
	let password = req.body.password_signup;
	let phone = req.body.phone_signup;

	db.collection('Accounts').findOne({$or: [{email: email}, {phone: phone}]}, function (err, result) {
		if (!result) {

			password = crypto.createHmac('sha1', password).update(password).digest('hex');

			let new_account = {
				first_name: first_name,
				last_name: last_name,
				email: email,
				password: password,
				phone: phone,
				//bellow are reserved as placeholder
				profile_photo: {data: fs.readFileSync('images/default_profile_photo.png').toString('base64'),
					content_type: 'image/png'},
				showcase_photo: {data: fs.readFileSync('images/default_showcase_photo.png').toString('base64'),
					content_type: 'image/png'},
				gender: "secret",
				birthday: moment().format('YYYY-MM-DD'),
				country: "secret",
				city: "secret",
				job: "secret",
				sexual_orientation: "secret",
				personal_description: "-",
				facebook_link: "-"
			};
			db.collection('Accounts').insertOne(new_account, function(err) {
				if (err) throw err;
				console.log("Account registration successful");
			});
			res.render('signup_successful', {title: 'Sign up successful!'});
		} else {
			console.log("Account exists!");
			res.render('signup_failed', {title: 'Sign up failed!'});
		}
	});
});

//render signup page
app.get('/signup_page', function(req, res) {
	res.render('signup_page', {title: 'Sign up'});
});

//start server and render homepage
const port = 3000;
app.get('/', function(req, res) {
	res.set({
		'Access-Control-Allow-Origin': '*'
	});
	res.render('welcome_page', {title: 'Welcome to GlobalPal!'});
}).listen(port, function() {
	console.log("Server listening at port " + port);
});
