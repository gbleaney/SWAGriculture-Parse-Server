
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var push = require('cloud/push');
var Trap = require('cloud/trap'); // include the trap functions
var twilio = require('twilio')('AC7d19ea7635feb869b7e9d604dbe0b387', '9d92647c98001316d5dd653c34bb618e');
var twilioNumber = "+17059900308"
var Phone = Parse.Object.extend("Phone");

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

function registerPhone(req) {
    console.log("Registering Phone: " + req.body.From);

    var promise = new Parse.Promise();
    var query = new Parse.Query(Phone);

    query.equalTo("number", req.body.From);
    query.first({
        success: function (phone) {
            if (!phone) {
                console.log("Creating new phone");

                var newPhone = new Phone();
                newPhone.set("number", req.body.From);
                newPhone.save(null, {
                    success: function(newPhone) {
                        console.log("Created new phone with number: "+newPhone.number);
                        sendMessage(req.body.From, "You're now signed up!");
                        promise.resolve();
                    },
                    error: function(gameScore, error) {
                        console.log('Failed to create new phone, with error code: ' + error.message);
                        sendMessage(req.body.From, "There was an error signing you up!");
                        promise.resolve();
                    }
                });
            } else {
                console.log("Phone already exists");
                sendMessage(req.body.From, "You're already signed up!");
                promise.resolve();
            }
            
        },
        error: function (error) {
            console.warn("Error fetching phone in /receiveSMS: " + error.code + " " + error.message);
            promise.reject(error);
        }
    });

    console.log("Returning promise");
    return promise;
}

function sendMessage (to, message) {
    twilio.sendSms({
        to: to, 
        from: twilioNumber,
        body: message 
    }, function(err, responseData) { 
        if (err) {
            console.log(err);
        } else { 
            console.log(responseData.from); 
            console.log(responseData.body);
        }
    });
}

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

    registerPhone(req).then(function () {
        res.send('Success');
    }, function (error) {
        res.status(500).send({ error: error });
    });

});

// Attach the Express app to Cloud Code.
app.listen();
