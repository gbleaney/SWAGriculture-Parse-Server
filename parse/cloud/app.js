
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var push = require('cloud/push');
var Trap = require('cloud/trap'); // include the trap functions
var Phone = require('cloud/phone');

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


app.post('/receiveSMS', function(req, res) {

    console.log("Received a new text");

    Phone.register(req).then(function () {
        res.send('Success');
    }, function (error) {
        res.status(500).send({ error: error });
    });

});

// Attach the Express app to Cloud Code.
app.listen();
