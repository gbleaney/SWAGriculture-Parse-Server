var Parse = require('./parse')
var Trap = Parse.Object.extend("Trap");
function setTrapStatus(trap, sprungFlag) {
    return trap.save({
        sprung: sprungFlag
    });
}

function recordTrapAction (trap, action) {
    var TrapAction = Parse.Object.extend("TrapAction");
    var trapAction = new TrapAction();
    return trapAction.save({
        trapId: trap.get("trapId"),
        location: trap.get("location"),
        action: action
    })
}

function getTrap(trapId) {
    var query = new Parse.Query(Trap)
    query.equalTo("trapId", trapId)
    return query.first()
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
        var newTrap = new Trap()
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
        return trap.save()
    },
    /**
     * Delete the trap matching the given id
     */
    delete: function (trapId) {
        var promise = new Parse.Promise()
        getTrap(trapId).then(
            function (trap) {
                trap.destroy({
                    success: promise.resolve.bind(promise),
                    error: promise.reject.bind(promise)
                })
            },
            function (error) {
                promise.reject(error)
            }
        )
        return promise
    },
    all: function () {
        var query = new Parse.Query(Trap)
        return query.find()
    },
    trapToDictionary: function (trap) {
        return {
            location: {
                longitude: trap.get("location").longitude,
                latitude: trap.get("location").latitude
            },
            sprung: trap.get("sprung"),
            name: trap.get("name")
        }
    }
}
