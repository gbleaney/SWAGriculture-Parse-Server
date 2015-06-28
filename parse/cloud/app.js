
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
    var notificationPromise = new Parse.Promise();
    Trap.recordTrapAction(req.body.id, "trigger");
    Trap.find(req.body.id).then(function(trap) {
        return Parse.Promise.when(
            push.sendPush(trap.get("name")),
            Phone.notifyAll(trap.get("name") + " has been triggered.")
        )
    }).done(function () {
        notificationPromise.resolve();
    }).fail(function () {
        notificationPromise.reject();
    });
    var setStatus = Trap.setTrapStatus(req.body.id, true);

    Parse.Promise.when(notificationPromise, setStatus).done(function () {
        res.send("success");
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
                res.send("Success")
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
        res.send('Success');
    }, function (error) {
        res.status(500).send({ error: error });
    });

});

// app.post('/sendSMS', function(req, res) {

//     console.log("Received a new text");

//     Phone.register(req).then(function () {
//         res.send('Success');
//     }, function (error) {
//         res.status(500).send({ error: error });
//     });

// });

// Attach the Express app to Cloud Code.
app.listen();
