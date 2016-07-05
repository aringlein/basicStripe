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

  response.send("<!DOCTYPE HTML>
<html lang="en-US">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content='1;url=http://ovote-dev.parseapp.com/feed'>
        <script type="text/javascript">
            window.location.href = 'http://ovote-dev.parseapp.com/feed'
        </script>
        <title>Page Redirection</title>
    </head>
    <body>
        <!-- Note: don't tell people to `click` the link, just tell them that it is a link. -->
        If you are not redirected automatically, follow the <a href='http://example.com'>link to example</a>
    </body>
</html>");

});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});