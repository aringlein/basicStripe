var express = require('express');
var cors = require('cors');
var app = express();

var corsOptions = {
	origin: 'https://ovote.parseapp.com'
}

var port = process.env.PORT || 8080;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var stripe = require("stripe")("sk_live_VDCRR9PPUZfzPTnXaCp7XfbN");
var Parse = require("parse/node");

Parse.initialize("K1LHReBWbmi9HeesHsU1fGLviYgmFNur0YNzBTjJ","Kf6nyUpJbInyNv6HvvlkxBqGQx58qBG148oebkt7");

//promo code setup
const freeCode = "83920911";
const cheapCode = "23981928";
const cheapCoupon = "professorCheap";
const freeCoupon = "professorFree";
const tryCode = "TRYOVOTE";
const tryCoupon = "TRYOVOTE"

//gorgeous doc stuff, remove later
app.use(express.static(__dirname+ '/public'));
app.get("/", function(request, response) {
	response.sendFile(__dirname + '/index.html');
})

app.get("/clean", function(request, response) {
	response.sendFile(__dirname + '/clean.html');
});

app.post("/codeValidation", cors(corsOptions), function(request, response) {
	var promoCode = request.body.promoCode;
	if (promoCode) {
		console.log("got code: " + promoCode);
	} else {
		console.log("no code");
	}
	
	if (promoCode == freeCode) {
		response.send('free');
	} else if (promoCode == cheapCode) {
		response.send('cheap');
	} else if (promoCode == tryCode) {
		response.send('try');
	} else {
		response.send('none');
	}
});

app.post("/", cors(corsOptions), function(request, response) {

	console.log("got a request");

	var tokenId = request.body.tokenId;
	var userId = request.body.userId;
	var subscription = request.body.subscription;
	var email = request.body.email;
	var promoCode = request.body.promoCode;
	console.log(request.body);

	if (tokenId) {

		console.log("got a token");

		if (subscription) {

			var coupon;
			if (promoCode) {
				if (promoCode == freeCode) {
					console.log("choosing free");
					coupon = freeCoupon;
				} else if (promoCode == cheapCode) {
					console.log("choosing cheap");
					coupon = cheapCoupon;

				} else if (promoCode == tryCode) {
					console.log("choosing try");
					coupon = tryCoupon;
				} else {
					console.log("choosing bad coupon");
					coupon = undefined;
				}
			} else {
				console.log("choosing no coupon");
				coupon = undefined;
			}

			stripe.customers.create({
				source: tokenId,
				email: email,
				plan: "planMonthly",
				description: userId,
				coupon: coupon
			}, function(err, customer) {
				if (customer) {

					//get the user who made the charge
				  	var Purchase = Parse.Object.extend("Purchase");
				  	purchaseQuery = new Parse.Query(Purchase);
				  	purchaseQuery.equalTo('tokenId', tokenId);
				  	purchaseQuery.find({
				  		success: function(purchases) {
				  			if (purchases.length > 1) {
				  				console.log("more than one purchase");
				  				createError("Found more than one purchase for token: " + tokenId, purchases[0].get('user'), purchases[0].get('group'));   
				  			}
				  			if (purchases.length > 0) {
				  				purchase = purchases[0];
				  				purchase.set('charged', true);
				  				purchase.set('customer', customer.id);
				  				purchase.set('subscriptionId', customer.subscriptions.data[0].id);
				  				purchase.set('subscription', true);
				  				purchase.set('enabled', true);
				  				purchase.save({
				  					success: function(purchase) {
				                      console.log("purchase saved");
				                      response.send('success');
				                    },
				                    error: function(error) {
				                      console.log(error);
				                      createError("Error saving purchase", purchases[0].get('user'), purchases[0].get('group'));
				                      response.send('error');
				                      //very bad
				                    }
				  				});
				  			} else {
				  				createError("Found 0 purchases for token: "+ tokenId, undefined, undefined);
				  				response.send('error') //very bad
				  			}
				  		},
				  		error: function(error) {
				  			console.log(error);
				  			createError("Error retrieving purchases: " + error, undefined, undefined);
				  		}
				  	});
					
					

					
				} else {
					response.send('error');
				}
			});
		} else {
			//basic charge
			var charge = stripe.charges.create({
			  amount: 2000, // amount in cents, again
			  currency: "usd",
			  source: tokenId,
			  description: "1 Excel Upload"

			}, function(err, charge) {
			  	if (err && err.type === 'StripeCardError') {
			    // The card has been declined
			    console.log("card declined");
			    response.send('error');

				} else if (charge) {
				  	//get the user who made the charge
				  	var Purchase = Parse.Object.extend("Purchase");
				  	purchaseQuery = new Parse.Query(Purchase);
				  	purchaseQuery.equalTo('tokenId', tokenId);
				  	purchaseQuery.find({
				  		success: function(purchases) {
				  			if (purchases.length > 1) {
				  				console.log("more than one purchase");
				  				createError("Found more than one purchase for token: " + tokenId, purchases[0].get('user'), purchases[0].get('group'));   
				  			}
				  			if (purchases.length > 0) {
				  				purchase = purchases[0];
				  				purchase.set('charged', true);
				  				purchase.save({
				  					success: function(purchase) {
				                      console.log("purchase saved");
				                    },
				                    error: function(error) {
				                      console.log(error);
				                      createError("Error saving purchase", purchases[0].get('user'), purchases[0].get('group'));
				                    }
				  				});
				  			} else {
				  				createError("Found 0 purchases for token: "+ tokenId, undefined, undefined);
				  			}
				  		},
				  		error: function(error) {
				  			console.log(error);
				  			createError("Error retrieving purchases: " + error, undefined, undefined);
				  		}
				  	});
				  	//send success since charge went through
				  	response.send('success');
				}
			});
		}
	} else {
		createError("BasicStripe: tokenId is undefined", undefined, undefined);
		response.send('error');
	}

});

app.post("/unsubscribe", cors(corsOptions), function(request, response) {

	console.log("got a request to unsubscribe");
	var subscriptionId = request.body.subscriptionId;
	console.log("sub id" + subscriptionId);
	if (subscriptionId) {
		stripe.subscriptions.del(
			subscriptionId,
			{ at_period_end: true },
			function(err, confirmation) {
			   if (err) {
			   	console.log(err);
			   	response.send('error');
			   } else {
			   	response.send('success');
			   }
			}
		);
	}
});

//tries to save an error message to the database
var createError = function(message, user, group) {
	error = new Error ({
		message: message,
		user: user,
		group: group
	});
	error.save();
	console.log(message);
}

var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://gorgeousdoc3@gmail.com:gdgdgdgd@smtp.gmail.com');


app.post("/mail", function(request, response) {
	const email = request.body.email;
	const fullName = request.body.fullName;
	const message = request.body.message;
	if (email) {
		var emailBody = ""
		if (fullName) {
			emailBody+="Name: "+ fullName + "\n\n";
		} else {
			emailBody+="(No Name)\n\n";
		}
		if (email) {
			emailBody+= "Email: " + email + "\n\n";
		} else {
			emailBody+="(No email)\n\n";
		}
		if (message) {
			emailBody+="Message: " + message + "\n\n";
		} else {
			emailBody+= "(No message provided)\n\n";
		}
		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: '"Alex Ringlein" <alex.ringlein@gmail.com>', // sender address
		    to: 'nicholas.andris@gmail.com', // list of receivers
		    subject: 'Gorgeous Doc Submission', // Subject line
		    text: emailBody, // plaintext body
		};

		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
		    if(error){
		        console.log(error);
		        response.send(error);
		    } else {
		    	console.log('Message sent: ' + info.response);
		    	response.send('success');
		 	}
		});
	} else {
		response.send('error yo');
	}
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
