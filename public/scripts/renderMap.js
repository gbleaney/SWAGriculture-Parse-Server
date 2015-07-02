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
                        }
                    }
                })
            },
            map, minPoint, maxPoint;
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
