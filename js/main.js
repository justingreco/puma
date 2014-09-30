var config = {
	map: {
		baseLayer: {
			url: "http://maps.raleighnc.gov/arcgis/rest/services/BaseMapMobile/MapServer"
		},
		opLayers: [
			{
				name: "Boundaries",
				id: "boundaries",
				type: "dynamic",
				url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/PU_Boundaries/MapServer",
				visible: true,
				searchable: false,
				opacity: 0.60
			}, 		
			{
				name: "Water",
				id: "water",
				type: "dynamic",
				url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/WaterDistribution/MapServer",
				visible: true,
				searchLayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
				field: 'FACILITYID',
				searchable: true,
				opacity: 1
			}, 
			{
				name: "Sewer",
				id: "sewer",
				type: "dynamic",
				url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/SewerCollection/MapServer",
				visible: true,
				searchLayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				field: 'FACILITYID',
				searchable: true,
				opacity: 1
			},
			{
				name: "Reclaimed",
				id: "reclaimed",
				type: "dynamic",
				url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/ReclaimedDistribution/MapServer",
				visible: true,
				searchLayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
				field: 'FACILITYID',
				searchable: true,
				opacity: 1	
			},
			{
				name: "Addresses",
				id: "addresses",
				type: "dynamic",
				url: "http://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer",
				visible: false,
				searchLayers: [0],
				field: 'ADDRESS',
				searchable: true,
				opacity: 1
			}				
		]
	},
	searches: [
		{
			name: "Addresses",
			url: "http://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer",
			searchLayers: [0],
			field: 'ADDRESS'
		},					
		{
			name: "Water",
			url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/WaterDistribution/MapServer",
			searchLayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
			field: 'FACILITYID'
		}, 
		{
			name: "Sewer",
			url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/SewerCollection/MapServer",
			searchLayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			field: 'FACILITYID'
		},
		{
			name: "Reclaimed",
			url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/ReclaimedDistribution/MapServer",
			searchLayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
			field: 'FACILITYID'
		}				
	]
}

var map,
	asbuilts = [],
	mr,
	imgLyr;
var idCnt,
	idTot,
	idFeatures,
	idPoint;

function displayAsBuiltOnMap (feature) {
	require(["esri/geometry/Polygon"], function (Polygon) {
		var poly = new Polygon(feature.geometry);
		imgLyr.setVisibility(true);
		mr.lockRasterIds = [feature.attributes.OBJECTID];
		imgLyr.setMosaicRule(mr);
		map.setExtent(poly.getExtent(), true);
	});
}

function viewAsBuiltOnMap () {
	var name = $(this).data('name');
	name = name.split(".")[0];
	$.ajax({
		url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/AsBuilts/ImageServer/query",
		data: {
			f: "json",
			where: "Name = '" + name + "'",
			returnGeometry: true
		},
		dataType: "json",
		success: function (result) {
			if (result.features.length > 0) {
				var f = result.features[0];
				displayAsBuiltOnMap (f);
			}
		}
	});
}

function saveAsBuiltAsPDF () {
	var name = $(this).data("name").replace(".tif", ".pdf"),
		project = $(this).data("project"),
		url = "http://gis.raleighnc.gov/AsBuilts/" + project + "/" + name;
	window.open(url, "_blank");
}

function displayAsBuilts (features) {
	var tbody = $("tbody", "#asbuiltTable");
	tbody.empty();
	$(features).each(function (i, f) {
		var row = $("<tr><td>" + f.attributes.SHEETNUM + " of " + f.attributes.SHEETTOT + "</td><td></td><td></td></tr>").appendTo(tbody);
		var vBtn = $("<button data-name='" + f.attributes.SHEETNAME + "' type='button' class='btn btn-default'><span class='glyphicon glyphicon-eye-open'></span></button>");
		var sBtn = $("<button data-name='" + f.attributes.SHEETNAME + "' data-project='" + f.attributes.PROJECT + "' type='button' class='btn btn-default'><span class='glyphicon glyphicon-file'></span></button>");
		$("td:eq(1)", row).append(vBtn);
		$("td:eq(2)", row).append(sBtn);
		vBtn.click(viewAsBuiltOnMap);
		sBtn.click(saveAsBuiltAsPDF);
	});
}

function buildAsBuiltTable (features) {
	var sheets = Math.ceil(features.length/5);
	$(".pagination", "#asbuiltPanel").remove();
	if (sheets > 0) {
		var pagination = $("<ul class='pagination'></ul>").appendTo($(".panel-body", "#asbuiltPanel"));
		for (var i = 0;i < sheets;i++) {
			var li = $("<li><a href='javascript:void(0)'>" + (i + 1) +"</a></li>").appendTo(pagination);
			if (i === 0) {
				li.addClass("active");
			}
			li.click(function () {
				var index = $(this).index();
				$(".pagination>li", "#asbuiltPanel").removeClass("active");
				$(this).addClass("active");
				displayAsBuilts(asbuilts.slice(index*5, (index + 1) * 5));
			});
		}
	}

	displayAsBuilts(features.slice(0, 5));
}

function asBuiltProjectSelected (obj, datum, dataset) {
	$.ajax({
		url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/Drawings/MapServer/" + dataset + "/query",
		data: {
			"f": "json",
			"returnGeometry": false,
			"where": "PROJECT = '" + datum.value + "'",
			"orderByFields": "SHEETNUM",
			"outFields": "SHEETNUM, PROJECT, SHEETNAME, SHEETTOT"
		},
		dataType: "json",
		success: function (result) {
			asbuilts = result.features;
			buildAsBuiltTable (result.features);
		}
	});
}

function asBuiltFilter (resp) {
	var values = [];
	$(resp.features).each(function (i, f) {
		values.push(f.attributes.PROJECT);
	});
	return values;
}

function setAsbuiltTypeAhead () {
	$("#asbuiltInput").typeahead([
		{
			name: "1",
			header: "<h5>Water</h5>",
			remote: {
				url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/Drawings/MapServer/1/query?where=UPPER(PROJECT) LIKE UPPER('%QUERY%')&orderByFields=PROJECT&returnGeometry=false&outFields=PROJECT&returnDistinctValues=true&f=json",
				filter: asBuiltFilter
			}
		},
		{
			name: "0",
			header: "<h5>Sewer</h5>",
			remote: {
				url: "http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/Drawings/MapServer/0/query?where=UPPER(PROJECT) LIKE UPPER('%QUERY%')&orderByFields=PROJECT&returnGeometry=false&outFields=PROJECT&returnDistinctValues=true&f=json",
				filter: asBuiltFilter	
			}
		}
	]).on("typeahead:selected", asBuiltProjectSelected);
}

function displayPopup (features, point) {
	require(["esri/dijit/PopupTemplate"], function (PopupTemplate) {
		var fieldInfos = [],
			template = new PopupTemplate(),
			popupFeatures = [];
		$(features).each(function (i, f) {
			fieldInfos = [];
			for (var key in f.attributes) {
				if (key.toUpperCase() != "OBJECTID" && key.toUpperCase() != "SHAPE") {
					fieldInfos.push({fieldName: key, visible: true});
				}
			}
			template = new PopupTemplate({title:f.layerName, fieldInfos: fieldInfos});
			f.setInfoTemplate(template);
			popupFeatures.push(f);
		});
		map.infoWindow.setFeatures(popupFeatures);
		map.infoWindow.show(point);
	});
}

function displaySearchFeatureOnMap (result) {
	require(["esri/geometry/Point", "esri/geometry/Polyline", "esri/graphic"], function (Point, Polyline, Graphic) {
		var geom,
			graphic = new Graphic(result);
		switch (result.geometryType) {
			case "esriGeometryPoint":
				geom = new Point(result.geometry.x, result.geometry.y, map.spatialReference);
				map.centerAndZoom(geom, 12);
				displayPopup([graphic], geom);
			break;
			case "esriGeometryPolyline":
				geom = new Polyline(result.geometry);
				map.setExtent(geom.getExtent(), true);
				displayPopup([graphic], geom.getPoint(0,0));				
			break;	
		}

	});
}

function searchSelected (obj, datum, dataset) {
	var filter = $(config.searches).filter(function (i) {
		return this.name === dataset;
	});
	if (filter.length > 0) {
		var url = filter[0].url+"/find";
		$.ajax({
			url: url,
			data: {
				f: "json",
				searchText: datum.value,
				layers: filter[0].searchLayers.toString(),
				searchFields: filter[0].field,
				returnGeometry: true,
				contains: false
			},
			dataType: "json",
			success: function (data) {
				if (data.results.length > 0) {
					if (data.results[0].geometry) {
						displaySearchFeatureOnMap (data.results[0]);
					}					
				}

			}
		});
	}
}

function setTypeAhead() {
	var searches = [],
		layer;
	$(config.searches).each(function (i, s) {
			searches.push(
				{
					name: s.name,
					header: '<h5>' + s.name +'</h5>',
					remote: {url: s.url+"/find?searchText=%QUERY&searchFields="+s.field+"&layers="+s.searchLayers.toString()+"&returnGeometry=false&f=json",
						filter: function (resp) {
							var values = [];
							$(resp.results).each(function (i, r) {
								values.push(r.value);
							});
							return values;
						}
					}
				}
			);
	});
	$("#searchInput").typeahead(searches).on("typeahead:selected", searchSelected);
} 

function onButtonClicked () {
	var on = $(this).hasClass("btn-success"),
		id = $(this).data("id"),
		layer = map.getLayer(id),
		opLayer = $(config.map.opLayers).filter(function (i) {
			return this.id = id;
		});

	if (on) {
		$(this).removeClass("btn-success");
		$(this).addClass("btn-danger");
		$(this).text("Off");
	} else {
		$(this).removeClass("btn-danger");
		$(this).addClass("btn-success");		
		$(this).text("On");
	}

	if (layer) {
		layer.setVisibility(!on);
	}

	if (opLayer.length > 0) {
		opLayer[0].visible = !on;
	}

}

function buildLayerList () {
	var body = $("#layerPanel .panel-body");
	$(config.map.opLayers).each(function (i, l) {
		var div = $("<div class='layerDiv'></div>").appendTo(body),
			onBtn = $("<button class='btn' data-id='" + l.id + "'></button>").appendTo(div);
		div.append("<span>" + l.name +"</span>");

		onBtn.text((l.visible) ? "On" : "Off");
		onBtn.addClass((l.visible) ? "btn-success" : "btn-danger" );
		onBtn.click(onButtonClicked)
	});
}

function identifyComplete (results, point) {
	$(results).each(function (i, r) {
		idFeatures.push(r.feature);
	});
	idCnt += 1;
	if (idCnt === idTot) {
		displayPopup(idFeatures, idPoint);
	}
}

function identifyLayers (point) {
	require(['esri/tasks/IdentifyTask', 'esri/tasks/IdentifyParameters'], function (IdentifyTask, IdentifyParameters) {
		var visLyrs = $(config.map.opLayers).filter(function () {
				return this.visible;
			}), params = new IdentifyParameters(),
			task;
			
		idFeatures = [];
		idCnt = 0;
		idTot = visLyrs.length;
		idPoint = point;
		params.height = map.height;
		params.width = map.width;
		params.geometry = point;
		params.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
		params.mapExtent = map.extent;
		params.tolerance = 3;

		$(visLyrs).each(function(i, l) {
			idTask = new IdentifyTask(l.url);
			idTask.execute(params, identifyComplete);
		});

	});
}

function mapClickHandler (e) {
	var pt = e.mapPoint;
	identifyLayers(pt);
}


$(document).ready(function () {
	function addImageLayer (map) {
		require(["esri/layers/ArcGISImageServiceLayer", "esri/layers/MosaicRule"], function (ArcGISImageServiceLayer, MosaicRule) {
			mr = new MosaicRule();
			imgLyr = new ArcGISImageServiceLayer("http://gis.raleighnc.gov/arcgis/rest/services/PublicUtility/AsBuilts/ImageServer");
			imgLyr.setOpacity(0.50);
			imgLyr.id = "asbuilts";
			imgLyr.setVisibility(false);
			map.addLayer(imgLyr);
		});
	}

	function addOpLayers (map) {
		require(["esri/layers/ArcGISDynamicMapServiceLayer"], function (ArcGISDynamicMapServiceLayer) {
			$(config.map.opLayers).each(function (i, l) {
				var lyr = new ArcGISDynamicMapServiceLayer(l.url);
				lyr.id = l.id;		
				lyr.setVisibility(l.visible);
				lyr.setOpacity(l.opacity);
				map.addLayer(lyr);
			});
		});
	}

	require(["esri/map", "esri/layers/ArcGISTiledMapServiceLayer"], function (Map, ArcGISTiledMapServiceLayer) {
		map = new Map("map");
		var base = new ArcGISTiledMapServiceLayer(config.map.baseLayer.url);
		base.id = "basemap";
		map.addLayer(base); 

		addImageLayer(map);	

		addOpLayers(map);	
		buildLayerList();

		map.on('click', mapClickHandler);
	});

	setTypeAhead();
	setAsbuiltTypeAhead();
});