var express = require('express');
var cors = require('cors');
var app = express();

var corsOptions = {
	origin: 'https://ovote-dev.parseapp.com'
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

	if (tokenId) {

		console.log("got a token");

		var charge = stripe.charges.create({
		  amount: 1000, // amount in cents, again
		  currency: "usd",
		  source: tokenId,
		  description: "Example charge"

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
		  				console.log("more than one purchase ?!?");
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
		                    }
		  				});
		  			} else {
		  				console.log("no purchases found");
		  			}
		  		},
		  		error: function(error) {
		  			console.log(error);
		  		}
		  	})

		  } else {
		  	console.log("something weird happened");
		  	console.log("error: "+ err);
		  	console.log("error type: "+ err.type);
		  }
		});
	} else {
		console.log("token is undefined");
	}

	response.send('success');

});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});