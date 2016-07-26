var express = require('express');
var cors = require('cors');
var app = express();

var corsOptions = {
	origin: 'https://ovote-dev.parseapp.com/'
}

var port = process.env.PORT || 8080;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var stripe = require("stripe")("sk_test_aZwMDCGsxrnxJJKiCP1uid2X");

var Parse = require("parse/node");
Parse.initialize("fHRPbh6JQnYVePYz1zL60PYWmErk8cELuYPzCEkd","UJQNqaZip8qqwyUKkrjXJyvjgbwdZYgNZPeNNmCA");

app.post("/", cors(corsOptions), function(request, response) {

	

	console.log("got a request");

	var tokenId = request.body.tokenId;
	var userId = request.body.userId;
	console.log(request.body);

	if (tokenId) {

		console.log("got a token");

		stripe.customers.create({
		  source: tokenId,
		  description: userId
		}).then(function(customer) {
		  return stripe.charges.create({
		    amount: 2000, // amount in cents, again
		    currency: "usd",
		    customer: customer.id
		  });
		}).then(function(charge) {
		  userQuery = new Parse.Query(Parse.User);
		  userQuery.get(userId, {
		  	success: function(user) {
		  		user.set('customerId', customer.id);
		  		user.save();
		  		response.send('success');
		  	},
		  	error: function(error) {
		  		response.send('error');
		  	}
		  });
		});
		/*

		var charge = stripe.charges.create({
		  amount: 50, // amount in cents, again
		  currency: "usd",
		  source: tokenId,
		  description: "1 Excel Upload"

		}, function(err, charge) {
		  if (err && err.type === 'StripeCardError') {
		    // The card has been declined
		    console.log("card declined");

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

		  } else {
		  	createError("BasicStripe error: "+ err, undefined, undefined);
		  	response.send('error');	
		  }
		});*/
	} else {
		createError("BasicStripe: tokenId is undefined", undefined, undefined);
		response.send('error');
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

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});