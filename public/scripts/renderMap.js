var map,
    MIN_ZOOM_LEVEL = 20,
    // ko is the global name for the knockout library
    notifications = ko.observableArray(), // a knockout observable array will update the html on push/remove
    notificationTypes = {
        ERROR: "error", // red
        WARN: "warn", // yellow
        SUCCESS: "success", //green
        INFO: "info" // blue
    }

/**
 * Adds a notification to the bottom of the list of notifications
 * @param message {string} Text to display
 * @param [options] {object} containing additional information
 */
function addNotification (message, options) {
    options = options || {}
    var newNoty = {
        message: message,
        type: options.type || "",
        remove: function () {
            // called by on click and/or by the timeout
            notifications.remove(newNoty)
        }
    }
    if (typeof options.duration == "number") {
        setTimeout(function () {
            newNoty.remove() // calling remove twice is fine, just does nothing
        }, options.duration)
    }
    notifications.push(newNoty)
}
// An example call
//addNotification("Hello world!", {duration: 2500, type: notificationTypes.SUCCESS })

$(document).ready(function initialize () {
    var mapCanvas = document.getElementById('map-canvas');
    $.get("/traps").done(function(traps) {
        var totalLongitude = 0,
            totalLatitude = 0,
            latMin = 180,
            latMax = -180,
            longMin = 90,
            longMax = -90,
            markers = [],
            mapOptions = {
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.HYBRID
            },
            accordion = $("#traps-accordion"),
            notificationContainer = $(".notifications-container"),
            trapsViewModel = {
                traps: traps.map(function (trap) {
                    return {
                        trapId: trap.trapId,
                        containerId: 'trap-' + trap.trapId,
                        name: trap.name,
                        iconColor: trap.sprung ? 'red' : 'green',
                        select: function (data, event) {
                            var element = $(event.currentTarget)
                            $(".active", accordion).removeClass('active');
                            element.addClass("active");
                            map.setCenter(new google.maps.LatLng(trap.location.latitude, trap.location.longitude))
                            if (map.getZoom() < MIN_ZOOM_LEVEL) {
                                map.setZoom(MIN_ZOOM_LEVEL)
                            }
                        }
                    }
                })
            },
            minPoint, maxPoint;
        traps.forEach(function (trap) {
            // default to 0 if undefined
            var long = trap.location.longitude;
            var lat = trap.location.latitude;
            longMin = Math.min(longMin, long);
            latMin = Math.min(latMin, lat);
            longMax = Math.max(longMax, long);
            latMax = Math.max(latMax, lat);
            totalLatitude += lat || 0;
            totalLongitude += long || 0;
            markers.push(new google.maps.Marker({
              position: new google.maps.LatLng(lat, long),
              title: trap.name
            }));
        });
        // render the side panel traps with knockoutjs
        ko.applyBindings(trapsViewModel, accordion[0])
        ko.applyBindings({
            notifications: notifications,
            animateIn: function (elem) {
                if (elem.nodeType === 1) {
                    $(elem).fadeIn()
                }
            },
            animateOut: function (elem) {
                if (elem.nodeType === 1) {
                    $(elem).fadeTo(300, 0).slideUp()
                }
            }
        }, notificationContainer[0])



        mapOptions.center = new google.maps.LatLng(totalLatitude/traps.length, totalLongitude/traps.length);
        map = new google.maps.Map(mapCanvas, mapOptions);
        minPoint = new google.maps.LatLng(latMin, longMin);
        maxPoint = new google.maps.LatLng(latMax, longMax);

        map.fitBounds(new google.maps.LatLngBounds(minPoint, maxPoint));
        var listener = google.maps.event.addListener(map, "idle", function() {
            if (map.getZoom() > 18) map.setZoom(18);
            google.maps.event.removeListener(listener);
        });
        markers.forEach(function (marker) {
            marker.setMap(map);
        })
    })
} );
