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
            map, minPoint, maxPoint;
        buildTrapSection(traps);
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

function buildTrapSection(traps) {
    var trapsContainer = $("#traps-accordion");
    traps.forEach(function (trap) {
        trapsContainer.append(buildTrap(trap));
    })
}

function buildTrap(trap) {
    var trapPanel = $("<div>")
        .addClass("panel panel-default trap-container");

    var header = $("<div>")
        .addClass("panel-heading")
        .attr("role", "tab")
        .attr("id", "header-" + trap.trapId)
    var headerTitle = $("<h4>")
        .addClass("panel-title trap-name")
        .appendTo(header);

    headerTitle.append('<div class="arrow-right"></div>');

    $('<a role="button" data-toggle="collapse" data-parent="#traps-accordion" aria-expanded="true"></a>')
        .attr("aria-controls", "control-"+trap.trapId)
        .attr("href", "header-"+trap.trapId)
        .text(trap.name)
        .appendTo(headerTitle);

    var description = $('<div class="trap-description">');
    description.append('<p>Last reset: 03/03/2015 22:15</p>');
    description.append('<p>Average activation: 14 hours</p>');
    description.append('<p>4 activations this month </p>');

    trapPanel.append(header);
    trapPanel.append(description);
    return trapPanel;
};