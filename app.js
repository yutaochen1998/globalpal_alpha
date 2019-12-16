#!/usr/bin/env node

//import modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
const engine = require('ejs-locals');
const crypto = require('crypto');

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
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'coursework is hell',
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));

//set view engine as 'ejs-locals'
app.engine('ejs', engine);
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');

//handle login request
app.post('/login', function(req, res) {

	let email = req.body.email_login;
	let password = req.body.password_login;

	db.collection('Accounts').find({email: email}).toArray(function (err, result) {
		if (err) throw err;
		if (result.length === 0) {
			console.log("Account doesn't exists!");
			res.render('login_failed', {title: 'Login failed', error_message: "Account doesn't exists!"});
		} else {
			password = crypto.createHmac('sha1', password).update(password).digest('hex');
			if (result[0].password !== password) {
				console.log("Password incorrect!");
				res.render('login_failed', {title: 'Login failed', error_message: "Password incorrect!"});
			} else {
				req.session.userID = email;
				console.log("Login successful!");
				console.log("userID: " + req.session.userID);
				res.render('start_friendship', {title: 'GlobalPal', user_name: result[0].firstName});
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

	let firstName = req.body.firstname_signup;
	let lastName = req.body.lastname_signup;
	let email = req.body.email_signup;
	let password = req.body.password_signup;
	let phone = req.body.phone_signup;

	db.collection('Accounts').find({$or: [{email: email}, {phone: phone}]}).toArray(function (err, result) {
		if (result.length === 0) {

			password = crypto.createHmac('sha1', password).update(password).digest('hex');

			let new_account = {
				firstName: firstName,
				lastName: lastName,
				email: email,
				password: password,
				phone: phone,
				//bellow are reserved as placeholder
				profile: {data: fs.readFileSync('images/default_profile.png'), contentType: 'image/png'},
				gender: "secret",
				age: "secret",
				birthday: "secret",
				country: "secret",
				city: "secret",
				job: "secret",
				sexualOrientation: "secret",
				personalDescription: "secret",
				facebookLink: "secret",
			};
			db.collection('Accounts').insertOne(new_account, function(err) {
				if (err) throw err;
				console.log("Account registered Successfully!");
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

//show homepage
const port = 3000;
app.get('/', function(req, res) {
	res.set({ 
		'Access-Control-Allow-Origin': '*'
	});
	res.render('welcome_page', {title: 'Welcome to GlobalPal!'});
}).listen(port, function() {
	console.log("Server listening at port " + port);
});
