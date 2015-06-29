
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var push = require('cloud/push');
var Trap = require('cloud/trap'); // include the trap functions
var Phone = require('cloud/phone');
var Map = require('cloud/map');


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
    new Parse.Promise();
    Trap.recordTrapAction(req.body.id, "trigger");
    // note: notificationPromise completes after the promise inside the 'then' resolves, not after 'find' completes
    var notificationPromise = Trap.find(req.body.id).then(function(trap) {
        // return a new promise that resolves when all the notifications have been sent
        return Parse.Promise.when(
            push.sendPush(trap.get("name")),
            Phone.notifyAll(trap.get("name") + " has been triggered.", Map.getLinkForTraps([trap]))
        )
    });
    var setStatus = Trap.setTrapStatus(req.body.id, true);

    Parse.Promise.when(notificationPromise, setStatus).done(function () {
        res.send({success: true});
    }).fail(function (error) {
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
app.get('/trap/:id', function (req, res) {
    Trap.find(req.param("id")).done(function (trap) {
        res.send(Trap.trapToDictionary(trap))
    }).fail(function (error) {
        res.status(500).send("An error occurred: " + error.message);
    })
});

app.get('/traps', function (req, res) {
    Trap.all().done(function (traps) {
        res.send(traps.map(Trap.trapToDictionary))
    }).fail(function (error) {
        res.status(500).send("An error occurred: " + error.message);
    })
});
app.post('/trap', function (req, res) {
    Trap.find(req.body.trapId).then(function (existingTrap) {
        var promise;
        if (existingTrap) {
            promise = Trap.update(existingTrap, req.body);
        } else {
            promise = Trap.create(req.body);
        }
        promise.then(
            function () {
                res.send({success: true})
            },
            function (error) {
                res.status(500).send("An error occurred: " + error.message);
            }
        )
    })
});

app.delete('/trap/:trapId', function (req, res) {
    Trap.delete(req.param("trapId")).then(
        function () {
            res.send("Deleted trap info")
        },
        function (error) {
            res.status(500).send("An error occurred: " + error.message);
        }
    )
});


app.post('/receiveSMS', function(req, res) {

    console.log("Received a new text");

    Phone.register("+15199988289").then(function () {
        res.send({success:true});
    }, function (error) {
        res.status(500).send({ error: error });
    });

});

app.post('/sendSMS', function(req, res) {

    console.log("Texting everyone");

    Phone.notifyAll("Test").then(function () {
        res.send({success:true});
    }, function (error) {
        res.status(500).send({ error: error });
    });

});

app.get('/map', function(req, res) {

    console.log("Getting map");

    Trap.all().done(function (traps) {
        res.send(Map.getLinkForTraps(traps));
    });

});

// Attach the Express app to Cloud Code.
app.listen();
