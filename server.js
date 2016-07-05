var express = require('express');
var app = express();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));
bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));


	// Set your secret key: remember to change this to your live secret key in production
	// See your keys here https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe")("sk_test_aZwMDCGsxrnxJJKiCP1uid2X");

console.log("logging works");
// Using Express
app.post("/", function(request, response) {

	var stripeToken = request.body.stripeToken;

	var charge = stripe.charges.create({
	  amount: 1000, // amount in cents, again
	  currency: "usd",
	  source: stripeToken,
	  description: "Example charge"
	}, function(err, charge) {
	  if (err && err.type === 'StripeCardError') {
	    // The card has been declined
	  }
	});

  // Do something with event_json
  console.log(stripeToken);
  console.log("got dat token");

  response.send(200);

});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});