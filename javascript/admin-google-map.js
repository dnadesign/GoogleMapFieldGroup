/**
 * Influenced by: https://github.com/kinglozzer/SilverStripe-GMapsObject/blob/master/javascript/GMapsObject.js
 */

/**
 * [AD] I really want to refactor the hell out of this, but it'll do for now :-)
 */

var ss = ss || {};

ss.loadedGoogleMapsApi = false;


(function($) {
	
	$.entwine('ss', function($) {	

		$(".admin-google-map").entwine({

			onmatch: function() {

				var script = null;
				var opts = $(this).data("setup");

				if(ss.loadedGoogleMapsApi === false) {

					script = document.createElement("script");

                    script.type = "text/javascript";
                   
                    script.src = "//maps.googleapis.com/maps/api/js?v=3&key=" + opts.key + "&callback=initAdminGoogleMaps";

                    document.body.appendChild(script);

                    ss.loadedGoogleMapsApi = true;

				}
				else {
					initAdminGoogleMaps();
				}

			}

		});

	});

})(jQuery);

function initAdminGoogleMaps() {

	(function($) {

		var geocoder = new google.maps.Geocoder();

		$(".admin-google-map").each(function(){

			var $this = $(this);

			var $addressField = null;
			var $updateMapBtn = null;
			var $messageField = $('#message-field');

			var opts = $this.data("setup");
			var geocodeSearchTimer = null;
			var labelField = $("#" + opts.label_field); 
			var markersField = $("#" + opts.markers_field); 
			var latVal = opts.start_lat;
			var lngVal = opts.start_lng;
			var addressVal = "";
			var newAddress = "";
			var latLng = new google.maps.LatLng(latVal, lngVal);
			var mapOptions = {
				center: latLng,
				zoom: opts.zoom,
				scrollwheel: false,
			};

			var markers = markersField.val() || [];

			var directionsService = new google.maps.DirectionsService();

			// Define what stage of the route map creation process we're at
			
			var labelStrings = [
				'To create a route, first click to add a start location',
				'Next, add a finish location',
				'Now add any waypoints along the way. Feel free to drag them around'
			];

			var map = new google.maps.Map($this[0], mapOptions);
			var directionsDisplay = new google.maps.DirectionsRenderer({
				draggable: true,
				map: map,
				panel: document.getElementById('map-panel-literal'),
			});

			map.setCenter(latLng);
			
			if(markers.length > 0){
				markers = JSON.parse(markers);

				$.each(markers, function(k, v){
					addMarker({ lat: v.lat, lng: v.lng })
				});

				// Show relevangt waypoints boxes depending on length of markers box
				if(markers.length > 2) {
					for(var i = 1; i <= markers.length - 2; i ++ ){
						$('.waypoints--' + i).show();
					}
				}

				getDirections();
			}

			var currentState = markers.length;
			
			updateLabel(currentState);

			function setLatLng(lat, lng, panMap) {
				var center = new google.maps.LatLng(lat, lng)
				// marker.setPosition(center);				
	        	if(panMap !== undefined) {
	        		map.panTo(center);
	        	}
			}

			function addMarker(location){
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(location.lat, location.lng),
					animation: google.maps.Animation.DROP,
					map: currentState === 1 ? map : null,
					number: currentState,
					draggable: true
				})
			}

			function placeMarker(location){

				var obj = { lat: location.lat(), lng: location.lng(), desc: '' };

				addMarker(obj);

				if(currentState > 2){
					markers.splice(markers.length - 1, 0, obj);
				}else{
					markers.push(obj);
				}

				markersField.val(JSON.stringify(markers));
			}

			function updateLabel(i) {

				if(currentState < labelStrings.length){
					return labelField.text(labelStrings[i]);
				}

			}

			function getDirections() {

				var waypoints;

				if(markers.length > 2){
					waypoints = markers.slice(1, markers.length - 1);
					$.each(waypoints, function(k, v){
						pos = new google.maps.LatLng(v.lat, v.lng);
						waypoints[k] = {
    						location: pos,
    						stopover: true
						}
					});

				} 

				var request = {
					origin: new google.maps.LatLng(markers[0].lat, markers[0].lng),
					destination: new google.maps.LatLng(markers[markers.length - 1].lat, markers[markers.length - 1].lng),
					waypoints: waypoints,
					optimizeWaypoints: true,
					travelMode: google.maps.TravelMode.DRIVING
				}

				directionsService.route(request, function(response, status) {
					if (status == google.maps.DirectionsStatus.OK) {
						// markers[0].setVisible(false);
						directionsDisplay.setOptions({ preserveViewport: true });
						directionsDisplay.setDirections(response);
					} else {

						// Reset current state to 0 and blast array out
						currentState = 0;
						markers = [];

            			$messageField.html('<p class="messagefield messagefield--error">Directions request failed due to ' + status + '. Please try again</p>');

            			setTimeout(hideError, 2000);
      				}
				})
			}

			function hideError(){
				$messageField.find('p').animate({
					height: 0
				}, 500, function(){
					$(this).parent().empty();
				})
			}

			function enableWaypointTextBox(i) {
				$('.waypoint--' + i).show();
			}

			google.maps.event.addListener(map, 'click', function(event) {
				currentState++;
				placeMarker(event.latLng);
				updateLabel(currentState);

				if(currentState >= 2) {
					// Get route
					getDirections();
					if(currentState >= 3) {
					
						enableWaypointTextBox(currentState - 2);
					
					}

				}
			})

			$('#' + opts.tab + '[aria-hidden="false"]').entwine({
	            onmatch: function() {
					google.maps.event.trigger(map, 'resize');
					map.setCenter(latLng);

	            }
	        });

			// update the markers array with all values, this is pretty gnarly performance wise so would change this at some point
			$('.markertext').on('keyup', function(){
				var markerVal = JSON.parse(markersField.val());

				$('input.markertext:visible').each(function(k){

					if(markerVal[k]){
						markerVal[k].desc = $(this).val();
					}
				})

				markersField.val(JSON.stringify(markerVal));
			})

	        if(opts.address_field !== undefined) {

	        	$addressField = $('.cms-edit-form input[name="MapCentre"], .cms-edit-form textarea[name="MapCentre"]');

	        	addressVal = $addressField.val();
	        	newAddress = addressVal;

	        	if(!$addressField.next().is("button")) {

		        	$updateMapBtn = $("<button type='button'>Update map</button>")
						.insertAfter($addressField)        					
						.on("click", function(){

							newAddress = $addressField.val();

							geocoder.geocode({
								'address': newAddress
							}, function(responses) {
						            if (responses && responses.length > 0) {

						                var lat = responses[0].geometry.location.lat();
										var lng = responses[0].geometry.location.lng();

										setLatLng(lat, lng, true);
										map.setZoom(12);
						            }
						        }
						    );

						    addressVal = newAddress;   

						});

	        	}


		    }

	    });

	})(jQuery);

}
