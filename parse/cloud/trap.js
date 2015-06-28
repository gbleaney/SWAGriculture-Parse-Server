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

module.exports = {
    setTrapStatus: setTrapStatus,
    recordTrapAction: recordTrapAction,
    /**
     * Instantiate a new trap in the database
     * @param data
     *      data.longitude {Number}
     *      data.latitude {Number}
     *      data.trapId {string} ID of the transmitter in the trap
     *      [data.name] {string} User's name for the trap. Will default to something if not provided
     */
    create: function (data) {
        // TODO find an existing trap, if it exists, update instead
        var newTrap = new Trap();
        return newTrap.save({
            trapId: data.trapId,
            location: new Parse.GeoPoint({
                longitude: (typeof data.longitude === "number") ? data.longitude : parseFloat(data.longitude),
                latitude: (typeof data.latitude === "number") ? data.latitude : parseFloat(data.latitude)
            }),
            name: data.name,
            sprung: false // TODO: Find any trap actions for the newly created trap, set sprung status correctly
        })
    },
    update: function () {
    },
    /**
     * Delete the trap matching the given id
     */
    delete: function (trapId) {

    }
};