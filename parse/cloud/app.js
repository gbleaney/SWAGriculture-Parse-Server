
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var push = require('cloud/push');
var Trap = require('cloud/trap'); // include the trap functions
var twilio = require('twilio')('AC7d19ea7635feb869b7e9d604dbe0b387', '9d92647c98001316d5dd653c34bb618e');

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/hello', function(req, res) {
    res.render('hello', { message: 'Congrats, you just set up your app!' });
});

// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });

app.post('/trigger', function(req, res) {
    Trap.recordTrapAction(req.body.id, "trigger");
    Trap.find(req.body.id).then(function(trap) {
        push.sendPush(trap.get("name"))
    });
    Trap.setTrapStatus(req.body.id, true).then(function () {
        res.send(req.body);
    }, function (error) {
        res.status(500).send({ error: error });
    })
});
app.post('/reset', function(req, res) {
    Trap.recordTrapAction(req.body.id, "reset");
    Trap.setTrapStatus(req.body.id, false).then(function () {
        res.send(req.body);
    }, function (error) {
        res.status(500).send({ error: error });
    });
});

app.post('/trap', function (req, res) {
    Trap.create(req.body).then(function () {
        res.send("Created trap")
    },
    function (error) {
        res.status(500).send("An error occurred: " + error.message);
    })
});

app.post('/receiveSMS',
         function(req, res) {

  console.log("Received a new text: " + req.body.From);
  res.send('asdf');

  twilio.sendSms({
    to: req.body.From, 
    body: 'Hello!' 
  }, function(err, responseData) { 
    if (err) {
      console.log(err);
    } else { 
      console.log(responseData.from); 
      console.log(responseData.body);
    }
  }
);
});

// Attach the Express app to Cloud Code.
app.listen();
