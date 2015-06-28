var Phone = Parse.Object.extend("Phone");
var twilio = require('twilio')('AC7d19ea7635feb869b7e9d604dbe0b387', '9d92647c98001316d5dd653c34bb618e');
var twilioNumber = "+17059900308";

function register(req) {
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
                    success: function(newPhoneObject) {
                        console.log("Created new phone: " + JSON.stringify(newPhoneObject));
                        sendMessage(req.body.From, "You're now signed up!");
                        promise.resolve();
                    },
                    error: function(newPHone, error) {
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

function notifyAll(message) {
	console.log("Notifying all phones");
    var promise = new Parse.Promise();
    var query = new Parse.Query(Phone);

    query.find({
        success: function (phones) {
            if (!phones) {
                console.log("No phones registered!");
                promise.resolve();

                
            } else {
            	for (var i = phones.length - 1; i >= 0; i--) {
            		console.log("Messaging " + phones[i]["number"]);
            		sendMessage(phones[i]["number"], message);
            	};
            	promise.resolve();
            }
        },
        error: function (error) {
            console.warn("Error in notifyAll: " + error.code + " " + error.message);
            promise.reject(error);
        }
    });

    console.log("Returning promise from notifyAll");
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

module.exports = {
    register: register,
    notifyAll: notifyAll,

    create: function (data) {
    },
    update: function () {
    },
    delete: function (trapId) {
    }
};