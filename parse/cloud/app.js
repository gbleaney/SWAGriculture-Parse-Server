
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();

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


function setTrapStatusStable(trapId, sprungFlag) {
    var Trap = Parse.Object.extend("Trap");
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
    var Trap = Parse.Object.extend("Trap");
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

  console.log("Received a new text: " + req.body.From);
  res.send('asdf');
});

// Attach the Express app to Cloud Code.
app.listen();
