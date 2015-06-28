var Trap = Parse.Object.extend("Trap");
function setTrapStatus(trapId, sprungFlag) {
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

function getTrap(trapId) {
    var query = new Parse.Query(Trap);
    query.equalTo("trapId", trapId);
    return query.first();
}

function createGeopoint(longitude, latitude) {
    return new Parse.GeoPoint({
                longitude: (typeof longitude === "number") ? longitude : parseFloat(longitude),
                latitude: (typeof latitude === "number") ? latitude : parseFloat(latitude)
            })
}

module.exports = {
    setTrapStatus: setTrapStatus,
    recordTrapAction: recordTrapAction,
    find: getTrap,
    /**
     * Instantiate a new trap in the database
     * @param data
     *      data.longitude {Number}
     *      data.latitude {Number}
     *      data.trapId {string} ID of the transmitter in the trap
     *      [data.name] {string} User's name for the trap. Will default to something if not provided
     */
    create: function (data) {
        var newTrap = new Trap();
        return newTrap.save({
            trapId: data.trapId,
            location: createGeopoint(data.longitude, data.latitude),
            name: data.name,
            sprung: false // TODO: Find any trap actions for the newly created trap, set sprung status correctly
        })
    },
    /**
     * Updates the location and name fields of a given trap
     * NOTE: Will NOT update any other fields
     * @param trap
     * @param newData
     *      newData.longitude
     *      newData.latitude If both provided, will set location of trap
     *      newData.name {string}
     */
    update: function (trap, newData) {
        if (newData.longitude && newData.latitude) {
            trap.set("location", createGeopoint(newData.longitude, newData.latitude))
        }
        if (newData.name) {
            trap.set(newData.name)
        }
        return trap.save();
    },
    /**
     * Delete the trap matching the given id
     */
    delete: function (trapId) {
        var promise = new Parse.Promise();
        getTrap(trapId).then(
            function (trap) {
                trap.destroy({
                    success: promise.resolve.bind(promise),
                    error: promise.reject.bind(promise)
                });
            },
            function (error) {
                promise.reject(error);
            }
        );
        return promise;
    }
};