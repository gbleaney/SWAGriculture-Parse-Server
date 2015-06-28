
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var push = require('cloud/push');
var twilio = require('twilio')('AC7d19ea7635feb869b7e9d604dbe0b387', '9d92647c98001316d5dd653c34bb618e');

var Trap = Parse.Object.extend("Trap");
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
function getTrap(trapId) {
    var query = new Parse.Query(Trap);
    query.equalTo("trapId", trapId);
    return query.first();
}

function setTrapStatusStable(trapId, sprungFlag) {
    var promise = new Parse.Promise();
    var query = new Parse.Query(Trap);
    query.equalTo("trapId", trapId);
    query.first({
        success: function (trap) {
            if (!trap) {
                promise.reject("No trap found");
                return;
            }
            console.log("Found a trap")
            console.log(trap);
            trap.save({
                sprung: sprungFlag
            });
            promise.resolve();
        },
        error: function (error) {
            console.warn("Error fetching trap in /trigger: " + error.code + " " + error.message);
            promise.reject(error);
        }
    });
    return promise;
}

function setTrapStatusUnstable(trapId, sprungFlag) {
    var promise = new Parse.Promise();
    var query = new Parse.Query(Trap);
    query.equalTo("trapId", trapId);
    query.first({
        success: function (trap) {
            if (!trap) {
                promise.reject("No trap found");
                return;
            }
            trap.save({
                sprung: sprungFlag
            }, {
                success: promise.resolve.bind(promise),
                error: promise.reject.bind(promise)
            });
            promise.resolve();
        },
        error: function (error) {
            console.warn("Error fetching trap in /trigger: " + error.code + " " + error.message);
            promise.reject(error);
        }
    });

    return promise;
}

function recordTrapAction (trapId, action) {
    var TrapAction = Parse.Object.extend("TrapAction");
    var trapAction = new TrapAction();
    return trapAction.save({
        trapId: trapId,
        action: action
    })
}

function sendMessage (to, from, message) {
    twilio.sendSms({
        to: to, 
        from: from,
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
    setTrapStatusStable(req.body.id, true).then(function () {
        recordTrapAction(req.body.id, "trigger");
        res.send(req.body);
    }, function (error) {
        res.status(500).send({ error: error });
    })
});
app.post('/reset', function(req, res) {
    setTrapStatusStable(req.body.id, false).then(function () {
        recordTrapAction(req.body.id, "reset");
        res.send(req.body);
    }, function (error) {
        res.status(500).send({ error: error });
    });
});

app.post('/triggertest', function(req, res) {
    getTrap(req.body.id).then(function(trap) {
        push.sendPush(trap.get("name"))
    });
    setTrapStatusUnstable(req.body.id, true).then(function () {
        recordTrapAction(req.body.id, "trigger");
        res.send(req.body);
    }, function (error) {
        res.status(500).send({ error: error });
    });
});
app.post('/resettest', function(req, res) {
    setTrapStatusUnstable(req.body.id, false).then(function () {
        recordTrapAction(req.body.id, "reset");
        res.send(req.body);
    }, function (error) {
        res.status(500).send({ error: error });
    });
});


app.post('/receiveSMS',
         function(req, res) {

    console.log("Received a new text: " + JSON.stringify(req.body));

    res.send('Success');

    var query = new Parse.Query(Phone);
    query.equalTo("number", req.body.To);
    query.first({
        success: function (phone) {
            if (!phone) {
                var newPhone = new Phone();
                newPhone.set("number", req.body.From);
                newPhone.save(null, {
                    success: function(newPhone) {
                        console.log("Created new phone with number: "+newPhone.number);
                        sendMessage(req.body.From, req.body.To, "You're now signed up!");
                    },
                    error: function(gameScore, error) {
                        console.log('Failed to create new phone, with error code: ' + error.message);
                        sendMessage(req.body.From, req.body.To, "There was an error signing you up!");
                    }
                });
            } else {
                console.log("Phone already exists");
                sendMessage(req.body.From, req.body.To, "You're already signed up!");
            }
        },
        error: function (error) {
            console.warn("Error fetching phone in /receiveSMS: " + error.code + " " + error.message);
        }
    });

    
});

// Attach the Express app to Cloud Code.
app.listen();
