<?php 

// [AD] GoogleMapFieldGroup - Initial idea taken from GoogleMapField and then extended to be a full group
// Needs a bit of refactoring at some point but functions relatively well currently.

class GoogleMapFieldGroup extends CompositeField {

	public function __construct ($args = null) {

		// Only handle if an array is passed through, which will be the configuration,
		// otherwise let FieldGroup deal with it
		if($args && is_array($args)) {

			$markers_field_name = 'MapMarkers';
			$centre_field_name = 'MapCentre';

			$defaults = array(
				'width' => '100%',
				'height' => '500px',
				'heading' => '',
				'tab' => 'Root_Location',
				'address_field' => 'Address',
				'map_zoom' => 10,
				'start_lat' => '-38.87392853923629',
				'start_lng' => '175.67138671875'
			);

			// Merge provided options with defaults to create params
			$params = array_replace_recursive($defaults, $args);

			$css = 'style="width: ' . $params['width'] . '; height: ' . $params['height'] . '"';

			$js = array(
				'markers_field' => 'Form_ItemEditForm_'. $markers_field_name,
				'address_field' => $params['address_field'],
				'zoom' => $params['map_zoom'],
				'start_lat' => $params['start_lat'],
				'start_lng' => $params['start_lng'],
				'label_field' => $params['label_field'],
				'key' => GOOGLE_MAP_KEY
			);	

			$content = '';

			$content .= "<div id='admin-map' class='admin-google-map' " . $css . " data-setup='" . json_encode($js) . "'></div>";

			// VERY TEMPORARY - This would ideally be done dynamically but will suffice for now. Why 23? Well, Google Maps Directions Renderer only allows a maximum number of 23 waypoints including start and finish.
			for ($i=1; $i <= 23; $i++) { 

				$n = $i - 1;

				$title = 'Waypoint ' . $n . ' Text Information';

				if($i == 1) $title = 'Starting Marker Text Information';
				if($i == 23) $title = 'Finishing Marker Text Information';

				$tf = TextField::create('Marker_' . $i, $title)->addExtraClass('markertext');	

				if($i != 1 && $i != 23){

					$tf->addExtraClass('markertext--hideonenter');
					$tf->addExtraClass('waypoint--' . $n);
				}
				
				$marker_info[] = $tf;

			}

			$fields = array(
				HeaderField::create('MapInstructionsHeader', 'Map Instructions', 4),
				LabelField::create('MapInstructionsText'),
				TextField::create($centre_field_name, 'Map Centre'),
				LiteralField::create('MessageField', '<div id="message-field"></div>'),
				HiddenField::create($markers_field_name),
				LiteralField::create('Map', $content),
				TabSet::create(
					'Tabs',
					Tab::create(
						'Map Marker Detail',
						...$marker_info
					),			
					Tab::create(
						'Route Information',
						LiteralField::create('MapRouteResults', '<div id="map-panel-literal"><p>Create a route on the map. Once you\'ve done that, the Google Map information will appear here.</div>')
					)
				)
				
			);

			// Establish requirements
			Requirements::javascript(ADMIN_GOOGLE_MAP_DIR . "/javascript/admin-google-map.js");

			if(!$this->stat('jquery_included')) {
				Requirements::javascript(THIRDPARTY_DIR."/jquery/jquery.js");
			}

			parent::__construct($fields);

		}
		
	}


}