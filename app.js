#!/usr/bin/env node

//import modules
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
const engine = require('ejs-locals');
const crypto = require('crypto');
const moment = require('moment');
const fileUpload = require('express-fileupload');
require('express-ws')(app);
const tools = require('./javascripts/tools');

//configure mongodb connection
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false');

//set up mongodb connection
const db = mongoose.connection;
db.on('error', console.log.bind(console, "MongoDB connection error"));
db.once('open', function() {
    console.log("Connected to MongoDB");
});

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
	limits: {fileSize: 4 * 1024 * 1024} //limit image size at 4MB
}));

//set view engine as 'ejs-locals'
app.engine('ejs', engine);
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');

//set up websocket whisper & like service
let connections_wnl = {};
app.ws('/websocket_whisper_like', (ws, req) => {

	const email = req.session.userID;
	const email_search = req.session.userID_search;

	//push connected instance
	connections_wnl[email] = ws;
	console.log("Client connected to interaction service, user ID: " + email);

	ws.on('message', data => {
		db.collection('Accounts').findOne({email: email_search}, function (err, result_search) {
			if (err) throw err;

			let message;
			const data_parsed = JSON.parse(data);

			//update target user's message box and send back a notification
			if (data_parsed.whisper) {
				let message_box = result_search.message_box;
				tools.trimMessage(message_box,
					{time_stamp: moment().format('MMMM Do YYYY, h:mm a'),
						userID: email, message: data_parsed.message});
				db.collection("Accounts").updateOne({email: email_search},
					{$set: {message_box: message_box}}, function(err) {
						if (err) throw err;
					});
				message = "Whisper sent to "  + result_search.first_name + "!";
				console.log('Message box update successful, target user ID: ' + email_search);
				ws.send(JSON.stringify({whisper: true, message: message}));
			}

			//check both users' like box and send back a notification
			if (data_parsed.like) {
				db.collection('Accounts').findOne({email: email}, function (err, result) {
					if (err) throw err;

					let like_box = result.like_box;
					let like_box_search = result_search.like_box;
					let like_icon;
					let message;

					if (!like_box[email_search]) {
						//update my like box to like
						like_box[email_search] = true;
						like_icon = "💘";
						message = "You liked " + result_search.first_name + "!";
						if (like_box_search[email]) {
							//send system message (birthday & phone) to both users
							let message_box = result.message_box;
							like_icon = "💕";
							message = "You matched with " + result_search.first_name + "!\nCheck your message box.";
							tools.trimMessage(message_box,
								{time_stamp: moment().format('MMMM Do YYYY, h:mm a'),
									userID: 'System Message',
									message: 'You matched with ' +
										result_search.first_name + ' ' +
										result_search.last_name + '!<br>' +
										'User ID: ' + email_search + '<br>' +
										'Birthday: ' + result_search.birthday + '<br>' +
										'Phone: ' + result_search.phone});
							db.collection("Accounts").updateOne({email: req.session.userID},
								{$set: {message_box: message_box}}, function(err) {
									if (err) throw err;
								});
							message_box = result_search.message_box;
							tools.trimMessage(message_box,
								{time_stamp: moment().format('MMMM Do YYYY, h:mm a'),
									userID: 'System Message',
									message: 'You matched with ' +
										result.first_name + ' ' +
										result.last_name + '!<br>' +
										'User ID: ' + email + '<br>' +
										'Birthday: ' + result.birthday + '<br>' +
										'Phone: ' + result.phone});
							db.collection("Accounts").updateOne({email: req.session.userID_search},
								{$set: {message_box: message_box}}, function(err) {
									if (err) throw err;
								});
							console.log("Matched message sent, user ID: " + email + ", target user ID: " + email_search);
						}
					} else {
						//update my like box to cancel like
						delete like_box[email_search];
						like_icon = "❤️";
						message = "You cancelled like to " + result_search.first_name + "!";
					}
					db.collection("Accounts").updateOne({email: email},
						{$set: {like_box: like_box}}, function(err) {
							if (err) throw err;
						});
					console.log("Like box updated, user ID: " + email);
					ws.send(JSON.stringify({like: true, like_icon: like_icon, message: message}));
				});
			}
		});
	});
	ws.on('close', () => {
		//delete disconnected instance
		delete connections_wnl[email];
		console.log("Client disconnected to interaction service, user ID: " + email);
	});
});

//set up websocket chat lobby service
let connections_cl = {Europe: {}, America: {}, Asia: {}};
app.ws('/websocket_chat_lobby', (ws, req) => {

	const channel_select = req.session.channel_select;
	const userID = req.session.userID;

	//push connected instance
	connections_cl[channel_select][userID] = ws;
	console.log("Client connected to chat lobby @" + channel_select + ", user ID: " + userID);
	ws.on('message', data => {

		const data_parsed = JSON.parse(data);

		//broadcast to all connected clients within specific region
		if (data_parsed.chat) {
			Object.values(connections_cl[channel_select]).forEach(function (socket) {
				socket.send(JSON.stringify({chat: true,
					time_stamp: moment().format('h:mm:ss a'),
					userID: req.session.userID,
					message: data_parsed.message}));
			});
		}
		if (data_parsed.current_online) {
			ws.send(JSON.stringify({current_online: true, number: Object.keys(connections_cl[channel_select]).length}));
		}
	});

	ws.on('close', () => {
		//delete disconnected instance
		delete connections_cl[channel_select][userID];
		console.log("Client disconnected to chat lobby @" + channel_select + ", user ID: " + userID);
	});
});

//render chat lobby page
app.post('/chat_lobby', function (req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		req.session.channel_select = req.body.channel_select;
		res.render('chat_lobby', {
			title: 'Chat lobby',
			channel_select: req.session.channel_select,

			profile_photo_content_type_top_left: result.profile_photo.content_type,
			profile_photo_top_left: result.profile_photo.data
		});
	});
});

//render chat lobby channel selection page
app.get('/chat_lobby_channel', function (req, res) {
	res.render('chat_lobby_channel', {
		title: 'Select your channel',

		profile_photo_content_type_top_left: req.session.profile_photo_content_type,
		profile_photo_top_left: req.session.profile_photo_data
	});
});

//start fetch me one loop
app.get('/fetch_me_one_loop', function (req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		//*WARNING* There must be al least 1 accounts in each gender (male/female) excluding yourself to make sure this doesn't crash
		db.collection('Accounts').aggregate([
			{$match: tools.selectPipeline(req.session.fetch_gender, req.session.userID, req.session.userID_search)},
			{$sample: {size: 1}}
		]).next().then(function (result_random) {
			//set default like icon
			let like_icon = '❤️';
			//if I liked this user
			if (result.like_box[result_random.email]) {
				like_icon = '💘';
				//if both users liked each other
				if (result_random.like_box[req.session.userID]) {
					like_icon = '💕';
				}
			}
			req.session.userID_search = result_random.email;
			res.render('fetch_me_one_loop', {
				title: "Let's make some friends",
				email: result_random.email,
				first_name: result_random.first_name,
				last_name: result_random.last_name,
				gender: result_random.gender,
				age: tools.getAge(result_random.birthday),
				country: result_random.country,
				city: result_random.city,
				job: result_random.job,
				sexual_orientation: result_random.sexual_orientation,
				personal_description: result_random.personal_description,
				facebook_link: result_random.facebook_link,
				like_icon: like_icon,

				profile_photo_content_type_top_left: req.session.profile_photo_content_type,
				profile_photo_top_left: req.session.profile_photo_data,

				showcase_photo_content_type: result_random.showcase_photo.content_type,
				showcase_photo: result_random.showcase_photo.data
			});
		});
	});
});

//handle fetch me one request
app.post('/fetch_me_one_select', function (req, res) {
	req.session.fetch_gender = req.body.gender_select;
	res.redirect('/fetch_me_one_loop');
});

//render fetch me one gender selection page
app.get('/fetch_me_one_gender', function (req, res) {
	res.render('fetch_me_one_gender', {
		title: 'Choose your interest',

		profile_photo_content_type_top_left: req.session.profile_photo_content_type,
		profile_photo_top_left: req.session.profile_photo_data
	});
});

//handle clear message request
app.get('/clear_message', function (req, res) {
	db.collection('Accounts').updateOne({email: req.session.userID},
		{$set: {message_box: []}}, function (err) {
		if (err) throw err;
	});
	console.log('Message box cleared');
	res.redirect('back');
});

//render my message page
app.get('/my_message', function (req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;

		const message_box = result.message_box;
		let message_list = '';

		if (message_box.length > 0) {
			message_box.forEach(function (value) {
				message_list += '🔻' +
					value.time_stamp +
					' > ' +
					value.userID +
					'🔻<br>' +
					value.message +
					'<br><br>';
			});
		} else {
			message_list += 'Wow, such empty.';
		}
		res.render('my_message', {
			title: 'My message',
			message_list: message_list,

			profile_photo_content_type_top_left: req.session.profile_photo_content_type,
			profile_photo_top_left: req.session.profile_photo_data
		});
	});
});

//handle search by email request
app.post('/search_by_email', function(req, res) {

	const email = req.session.userID;
	const email_search = req.body.email_search;

	if (email_search === email) {
		res.redirect('/personal_info');
	} else {
		db.collection('Accounts').findOne({email: email}, function (err, result) {
			if (err) throw err;
			db.collection('Accounts').findOne({email: email_search}, function (err, result_search) {
				if (err) throw err;
				if (!result_search) {
					res.render('search_by_email_failed', {
						title: "User doesn't exist",
						profile_photo_content_type_top_left: req.session.profile_photo_content_type,
						profile_photo_top_left: req.session.profile_photo_data
					});
				} else {
					//set default like icon
					let like_icon = '❤️';
					//if I liked this user
					if (result.like_box[email_search]) {
						like_icon = '💘';
						//if both users liked each other
						if (result_search.like_box[email]) {
							like_icon = '💕';
						}
					}
					req.session.userID_search = email_search;
					res.render('search_by_email_result', {
						title: "Search result",
						email: email_search,
						first_name: result_search.first_name,
						last_name: result_search.last_name,
						gender: result_search.gender,
						age: tools.getAge(result_search.birthday),
						country: result_search.country,
						city: result_search.city,
						job: result_search.job,
						sexual_orientation: result_search.sexual_orientation,
						personal_description: result_search.personal_description,
						facebook_link: result_search.facebook_link,
						like_icon: like_icon,

						profile_photo_content_type_top_left: req.session.profile_photo_content_type,
						profile_photo_top_left: req.session.profile_photo_data,

						showcase_photo_content_type: result_search.showcase_photo.content_type,
						showcase_photo: result_search.showcase_photo.data
					});
				}
			});
		});
	}
});

//render search user by email page
app.get('/search_by_email_page', function(req, res) {
	res.render('search_by_email_page', {
		title: 'Search by email',

		profile_photo_content_type_top_left: req.session.profile_photo_content_type,
		profile_photo_top_left: req.session.profile_photo_data
	});
});

//handle edit photo request
app.post('/photo_edit', function(req, res) {
	if (req.files) {
		if (req.files.profile_photo_edit) {
			req.session.profile_photo_data = Buffer.from(req.files.profile_photo_edit.data).toString('base64');
			req.session.profile_photo_data_content_type = req.files.profile_photo_edit.mimetype;
			db.collection("Accounts").updateOne({email: req.session.userID},
				{$set: {profile_photo: {data: req.session.profile_photo_data,
							content_type: req.session.profile_photo_data_content_type}
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
	}
	res.redirect('/personal_info_edit_page');
});

//handle edit personal info request
app.post('/personal_info_edit', function(req, res) {
	req.session.first_name = req.body.first_name_edit;
	db.collection("Accounts").updateOne({email: req.session.userID},
		{$set: {first_name: req.session.first_name,
				last_name: req.body.last_name_edit,
				gender: req.body.gender_edit,
				birthday: req.body.birthday_edit,
				country: req.body.country_edit,
				city: req.body.city_edit,
				job: req.body.job_edit,
				phone: req.body.phone_edit,
				sexual_orientation: req.body.sexual_orientation_edit,
				personal_description: req.body.personal_description_edit,
				facebook_link: req.body.facebook_link_edit
			}}, function(err) {
			if (err) throw err;
		});
	console.log('Personal info edit successful');
	res.redirect('/personal_info_edit_page');
});

//render personal info edit page
app.get('/personal_info_edit_page', function(req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		res.render('personal_info_edit_page', {
			title: 'Personal info edit page',
			first_name: req.session.first_name,
			last_name: result.last_name,
			gender: result.gender,
			birthday: result.birthday,
			today: moment().format('YYYY-MM-DD'),
			country: result.country,
			city: result.city,
			job: result.job,
			phone: result.phone,
			sexual_orientation: result.sexual_orientation,
			personal_description: result.personal_description,
			facebook_link: result.facebook_link,

			profile_photo_content_type_top_left: req.session.profile_photo_content_type,
			profile_photo_top_left: req.session.profile_photo_data,

			profile_photo_content_type: req.session.profile_photo_content_type,
			profile_photo: req.session.profile_photo_data,

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
	res.redirect('/logout');
});

//render account delete confirm page
app.get('/delete_account_confirm', function (req, res) {
	res.render('delete_account_confirm', {
		title: 'Confirm before you go',

		profile_photo_content_type_top_left: req.session.profile_photo_content_type,
		profile_photo_top_left: req.session.profile_photo_data
	});
});

//handle password changing request
app.post('/change_password', function(req, res) {

	let password = req.body.password_change;
	//hash password before comparison
	password = crypto.createHmac('sha1', password).update(password).digest('hex');

	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		if (password === result.password) {
			res.render('change_password_result',
				{title: 'Password change failed!',
					message: 'Please use different password.',
					button_action: 'javascript:history.back()',
					button_value: 'Return',

					profile_photo_content_type_top_left: req.session.profile_photo_content_type,
					profile_photo_top_left: req.session.profile_photo_data
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

					profile_photo_content_type_top_left: req.session.profile_photo_content_type,
					profile_photo_top_left: req.session.profile_photo_data
				});
			console.log("Password change successful");
		}
	});
});

//render password changing page
app.get('/change_password_page', function(req, res) {
	res.render('change_password_page', {
		title: 'Change password',

		profile_photo_content_type_top_left: req.session.profile_photo_content_type,
		profile_photo_top_left: req.session.profile_photo_data
	});
});

//fetch account info and render page
app.get('/account_info', function(req, res) {
	res.render('account_info', {
		title: 'Account info',
		userID: req.session.userID,

		profile_photo_content_type_top_left: req.session.profile_photo_content_type,
		profile_photo_top_left: req.session.profile_photo_data,

		profile_photo_content_type: req.session.profile_photo_content_type,
		profile_photo: req.session.profile_photo_data,
	});
});

//fetch personal info and render page
app.get('/personal_info', function(req, res) {
	db.collection('Accounts').findOne({email: req.session.userID}, function (err, result) {
		if (err) throw err;
		res.render('personal_info', {
			title: 'Personal info',
			first_name: req.session.first_name,
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

			profile_photo_content_type_top_left: req.session.profile_photo_content_type,
			profile_photo_top_left: req.session.profile_photo_data,

			profile_photo_content_type: req.session.profile_photo_content_type,
			profile_photo: req.session.profile_photo_data,

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

//render main activity page
app.get('/start_friendship', function(req, res) {
	res.render('start_friendship', {
		title: 'GlobalPal',
		user_name: req.session.first_name,
		profile_photo_content_type_top_left: req.session.profile_photo_content_type,
		profile_photo_top_left: req.session.profile_photo_data});
});

//handle login request
app.post('/login', function(req, res) {

	const email = req.body.email_login;
	let password = req.body.password_login;

	db.collection('Accounts').findOne({email: email}, function (err, result) {
		if (err) throw err;
		if (!result) {
			console.log("Account doesn't exists");
			res.render('login_failed', {title: 'Login failed', error_message: "Account doesn't exists!"});
		} else {
			//hash password before comparing with that in the database
			password = crypto.createHmac('sha1', password).update(password).digest('hex');
			if (result.password !== password) {
				console.log("Password incorrect");
				res.render('login_failed', {title: 'Login failed', error_message: "Password incorrect!"});
			} else {
				req.session.userID = email;
				req.session.first_name = result.first_name;
				req.session.profile_photo_data = result.profile_photo.data;
				req.session.profile_photo_content_type = result.profile_photo.content_type;
				console.log("Login successful, user ID: " + req.session.userID);
				res.render('start_friendship', {
					title: 'GlobalPal',
					user_name: req.session.first_name,

					profile_photo_content_type_top_left: req.session.profile_photo_content_type,
					profile_photo_top_left: req.session.profile_photo_data});
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

	const email = req.body.email_signup;
	let password = req.body.password_signup;

	db.collection('Accounts').findOne({email: email}, function (err, result) {
		if (!result) {

			//hash password before saving to the database
			password = crypto.createHmac('sha1', password).update(password).digest('hex');

			const new_account = {
				first_name: req.body.first_name_signup,
				last_name: req.body.last_name_signup,
				email: email,
				password: password,
				phone: req.body.phone_signup,
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
				facebook_link: "-",
				message_box: [],
				like_box: {}
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
}).listen(process.env.PORT || port, function() {
	console.log("Server listening at port " + port);
});
