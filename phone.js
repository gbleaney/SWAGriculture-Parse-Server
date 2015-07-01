var Parse = require('./parse')
var Phone = Parse.Object.extend("Phone");
var twilio = require('twilio')('AC7d19ea7635feb869b7e9d604dbe0b387', '9d92647c98001316d5dd653c34bb618e');
var twilioNumber = "+17059900308";

function register(phoneNumber) {
    console.log("Registering Phone: " + phoneNumber);

    var promise = new Parse.Promise();
    var query = new Parse.Query(Phone);

    query.equalTo("number", phoneNumber);
    query.first({
        success: function (phone) {
            if (!phone) {
                console.log("Creating new phone");

                var newPhone = new Phone();
                newPhone.set("number", phoneNumber);
                newPhone.save(null, {
                    success: function(newPhoneObject) {
                        console.log("Created new phone: " + JSON.stringify(newPhoneObject));
                        sendMessage(phoneNumber, "You're now signed up!");
                        promise.resolve();
                    },
                    error: function(newPHone, error) {
                        console.log('Failed to create new phone, with error code: ' + error.message);
                        sendMessage(phoneNumber, "There was an error signing you up!");
                        promise.resolve();
                    }
                });
            } else {
                console.log("Phone already exists");
                sendMessage(phoneNumber, "You're already signed up!");
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

function notifyAll(message, image) {
    console.log("Notifying all phones");
    var promise = new Parse.Promise();
    var query = new Parse.Query(Phone);

    query.find({
        success: function (phones) {
            if (!phones || !phones.length) {
                console.log("No phones registered!");
                promise.resolve();
            } else {
                var messagePromises = [];
                for (var i = phones.length - 1; i >= 0; i--) {
                    console.log("Messaging " + JSON.stringify(phones[i]));
                    messagePromises.push(sendMessage(phones[i].get("number"), message, image));
                };
                Parse.Promise.when(messagePromises).done(function() {
                    promise.resolve(); 
                    console.log("Promises Finished")
                });
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

function sendMessage (to, message, image) {
    var promise = new Parse.Promise();
    console.log("Sending: "+ message + ", To: " + to + ", Image: " + image);

    twilio.sendMessage({
        body: message,
        to: to,
        from: twilioNumber,
        mediaUrl: image
    }, function(err, message) {
        console.log("MMS Sent. Error: " + err + " Message: "+message);

        promise.resolve();
    });

    return promise;
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
