
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var push = require('cloud/push');
var Trap = require('cloud/trap'); // include the trap functions
var Phone = require('cloud/phone');
var Map = require('cloud/map');
var http = require('http');
var twilio = require('twilio')('AC7d19ea7635feb869b7e9d604dbe0b387', '9d92647c98001316d5dd653c34bb618e');


// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/map', function(req, res) {
    Trap.all().done(function (traps) {
        res.render('map', { traps: traps });
    })
});

// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });


app.post('/trigger', function(req, res) {
    new Parse.Promise();
    // note: completes after the promise inside the 'then' resolves, not after 'find' completes
    Trap.find(req.body.id).then(function(trap) {
        // return a new promise that resolves when all the notifications have been sent, and the trap has been updated
        return Parse.Promise.when(
            push.sendPush(trap.get("name")),
            Phone.notifyAll(trap.get("name") + " has been triggered.", Map.getLinkForTraps([trap])),
            Trap.setTrapStatus(trap, true),
            Trap.recordTrapAction(trap, "trigger")
        )
    }).done(function () {
        res.send({success: true});
    }).fail(function (error) {
        res.status(500).send({ error: error });
    })
});
app.post('/reset', function(req, res) {
    Trap.find(req.body.id).then(function(trap) {
        return Parse.Promise.when(
            Trap.recordTrapAction(trap, "reset"),
            Trap.setTrapStatus(trap, false)
        );
    }).then(function () {
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

// TWILIO DEBUG CODE
function twilioRequest(options, callback) {
    options.url = twilio.getBaseUrl() + options.url + '.json';
    options.headers = {'Accept': 'application/json', 'User-Agent': "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36","version":"HTTP/1.1"}; // Work with response data
    console.log("Body length: " + JSON.stringify(options.body).length);

    return Parse.Cloud.httpRequest({
        method: options.method,
        url: options.url,
        //url: "farmerdan.parseapp.com/test2",
        headers: options.headers,
        body: options.body
    });
};
app.post('/test2', function (req, res) {
    console.log("TEST 2 ***********")
    console.log(req.body)
    res.send(req.body);
})
app.get('/test', function (req, res) {
    var logging = [];
    var message = {
        url: "/Accounts/AC7d19ea7635feb869b7e9d604dbe0b387/SMS/Messages",
        method: "POST",
        "body": {
            "From": "+17059900308",
            "To": "+15199988289",
            "MediaUrl": "http://3.bp.blogspot.com/-f0NsmUHz2kM/T8GUGoydNpI/AAAAAAAAAfg/KnEkgnFPzpc/s1600/smiley.png"
        }
    }

    twilioRequest(message).done(function (result) {
        res.send(result.data)
    }).fail(function () {
        res.status(500).send(arguments)
    })

})

function recurLog(object, name, logArray) {
    if (typeof object === "object") {
        logArray.push("Properties of " + name)
        logArray.push(Object.getOwnPropertyNames(object));
        for (var key in object) {
            recurLog(object[key], key, logArray)
        }
    } else {
        logArray.push(name + ": " + object)
    }
}
// END TWILIO

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
