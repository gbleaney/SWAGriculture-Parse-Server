var Parse = require('./parse')
var Map = Parse.Object.extend("Map");

function getLinkForTraps(traps) {
	console.log("Getting link for traps: " + JSON.stringify(traps));
    var promise = new Parse.Promise();

    var url = "https://maps.googleapis.com/maps/api/staticmap?size=300x300&maptype=hybrid";

    var sprungTraps = [];
    var unsprungTraps = [];

    for (var i = traps.length - 1; i >= 0; i--) {
    	if(traps[i].get("sprung")){
    		sprungTraps.push(traps[i]);
    	} else {
    		unsprungTraps.push(traps[i]);
    	}
    };

    console.log("Sprung Traps: "+JSON.stringify(sprungTraps));
    console.log("Unsprung Traps: "+JSON.stringify(unsprungTraps));


    var sprungMarkerString = "color:red|label:S";
    var unsprungMarkerString = "color:green|label:U";

    for (var i = sprungTraps.length - 1; i >= 0; i--) {
    	sprungMarkerString += "|" + sprungTraps[i].get("location").latitude + "," + sprungTraps[i].get("location").longitude;
    };

    for (var i = unsprungTraps.length - 1; i >= 0; i--) {
    	unsprungMarkerString += "|" + unsprungTraps[i].get("location").latitude + "," + unsprungTraps[i].get("location").longitude;
    };

    // TODO ask graham if this works with two duplicate url params
    url += (sprungTraps.length==0 ? "" :  "&markers=" + encodeURIComponent(sprungMarkerString)) + (unsprungTraps.length == 0 ? "" : "&markers=" + encodeURIComponent(unsprungMarkerString));

    console.log("URL: " + url);

    return url;

}


module.exports = {
    getLinkForTraps: getLinkForTraps,
};
