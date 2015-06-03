if(!window.makoci) {
	window.makoci = function() {};
}


/**
 * @namespace
 */
makoci.layer = function() {};

/**
 * markermanager用來存放marker manager的物件
 */
//$.getScript('http://www.makoci.com/js/iSDSS/markermanager_packed.js');
makoci.layer.markerManager=null;



/**
 * CreateImageMapType 建立GMAP3的ImageMapType, 並且寫入copyright資訊至div_map_copyright中
 * @param {ImageMapTypeOptions} ImageMapTypeOptions
 * @return {ImageMapType} ImageMapType
 */
makoci.layer.createImageMapType=function(ImageMapTypeOptions){
	if(!ImageMapTypeOptions){
		console.log('[ERROR]ImageMapTypeOptions尚未設定，請重新設定！');
		return;
	}
	
	var imageMapType = new google.maps.ImageMapType(ImageMapTypeOptions);
	
	//add event
	google.maps.event.addListener(imageMapType, 'tilesloaded', function(){
		//add copyright
		if($("#div_map_copyright:contains('" + ImageMapTypeOptions.copyright + "')").length==0 && ImageMapTypeOptions.copyright!='' && ImageMapTypeOptions.copyright){
			$('#div_map_copyright').html($('#div_map_copyright').html()+ ImageMapTypeOptions.copyright + ' - ');
		}
	});

	return imageMapType;
}


//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * GTILE 專門用來讀取符合Google Tile標準的圖資
 * @class
 * @param (String) 資料來源
 * @param {String} url 此Tile圖資的URL位置，請在URL中，用{x}, {y}, {z}三個變數，代替x,y,z的數值<br>譬如：<br>http://www.makoci.com/z/x/y.png的URL，請寫成"http://www.makoci.com/{z}/{x}/{y}.png"
 * @param {ImageMapTypeOptions} 
 * @return {ImageMapType}
 */
makoci.layer.GTILE = function(url, copyright, ImageMapTypeOptions){
	//假如url後面有任何參數，有?的字串，url自動補上一個&, 方便後續區隔
	if(url.split('?').length>1){
		url=url+'&';
	}
	
	
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || copyright;
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ copyright;
	ImageMapTypeOptions.copyright=copyright;
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	
	
	ImageMapTypeOptions.getTileUrl=function(a, b){
		if (b >= ImageMapTypeOptions.minZoom && b <= ImageMapTypeOptions.maxZoom) {
			//假如z有公式計算的話
			var z = b;
			if (url.split('z:').length > 1) {
				var formula = url.substring(url.toUpperCase().indexOf("Z:") + 2, url.indexOf("&", url.toUpperCase().indexOf("Z:")));
				z = formula.split('-')[0] - b;
			}
			return url.replace(/{x}/g, a.x).replace(/{y}/g, a.y).replace(/{z}/g, z);
		}else {
			return "";
		}
	}

	return makoci.layer.createImageMapType(ImageMapTypeOptions);
}



//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
//Bing map
/**
 * Bing map
 * @class
 * @param {String} type 瀏覽BingMap的類型，目前只有"ROAD", "HYBRID", "SATELLITE"三種類型。
 * @param {ImageMapTypeOptions} 
 * @return {ImageMapType}
 */
makoci.layer.BING = function(type, ImageMapTypeOptions){
	this.type = type;
	var that=this;
	
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || (function(){
		switch (type) {
			case 'ROAD':
				return "Bing Map";
			break;
			case "SATELLITE":
				return "Bing Sat";
			break;
			case "HYBRID":
				return "Bing Hyb";
			break;
		}
	})();
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ 'Bing Map';
	ImageMapTypeOptions.copyright='Bing Map';
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	
	
	ImageMapTypeOptions.getTileUrl = function(a, b) {
			var n = that.imageUrlSubdomains.length,
				salt = ~~(Math.random() * n),
				quad_key = "";
				
			for(var i = 1; i <= b; i++) {
				quad_key += (((a.y >> b - i) & 1) << 1) | ((a.x >> b - i) & 1);
			}

			var server = Math.abs(salt + a.x + a.y + b) % n,
				t = "r";
				
			switch(that.type) {
				case "ROAD":
					t = "r";
					break;
				case "HYBRID":
					t = "h";
					break;
				case "SATELLITE":
					t = "a";
					break;
			}
			
			return that.imageUrl.replace("h{quadkey}", t + quad_key).replace("{subdomain}", that.imageUrlSubdomains[server]);
	};
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
};


/**
 * init Bing抓取其imageURL and imageUrlSubdomains兩個參數
 * 並且存回makoci.layer.BING.prototype中
 */
(function(){
	var _bing_key = 'AtDQYqd0prsug3D0KuZh4NpiLr81yvI5pkFwm-Fkhn1U7oihJjoGFB-kfdnkrRI7',
		 _bing_url = 'http://dev.virtualearth.net/REST/V1/Imagery/Metadata/AerialWithLabels?key=' + _bing_key + '&jsonp=?',
		_bing_imageUrl,
		_bing_imageUrlSubdomains,
		BING_proto=makoci.layer.BING.prototype;
		
	$.getJSON(_bing_url, function(json) {
		var resourceSets = json.resourceSets;
		for(var i = 0, max=resourceSets.length; i < max; i++) {	
			var resources = json.resourceSets[i].resources;
			for(var j = 0, max_j=resources.length; j < max_j; j++) {
				var resource = resources[j];
				BING_proto.imageUrl = resource.imageUrl;
				BING_proto.imageUrlSubdomains = resource.imageUrlSubdomains;
			}
		}
	});
}());


//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Open street map
 * @class
 * @param  {String} type OpenStreetMap(OSM)的地圖類型，目前包括："OSM", "HIKE&BIKE"。
 * @example 1. new makoci.layer.OSM('OSM') <BR>2. new makoci.layer.OSM('HIKE&BIKE')。
 */
makoci.layer.OSM = function(type, ImageMapTypeOptions){
	this.type=type;
	var that=this;
	
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || (function(){
		switch (type) {
			case 'OSM':
				return "OpenStreetMap";
			break;
			case "HIKE&BIKE":
				return "Hike&Bike";
			break;
		}
	})();
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ 'Open Street Map';
	ImageMapTypeOptions.copyright='Open Street Map';
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	
	
	ImageMapTypeOptions.getTileUrl = function(a, b) {
		switch (that.type) {
				case "OSM":
					return "http://a.tile.openstreetmap.org/" + b + "/" + a.x + "/" + a.y + ".png";
					break;
				case "HIKE&BIKE":
					return "http://toolserver.org/tiles/hikebike/" + b + "/" + a.x + "/" + a.y + ".png";
					break;
		}
	};
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
};

//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
makoci.layer.AGMS=function(){};

/**
 * ArcGIS Map Tiled Service 
 * @class
 * @param {String} url ArcGIS Map Tiled Service網址
 * @param {Integer} min 地圖最小解析度
 * @param {Integer} max 地圖最大解析度
 * @param {String} copyright 版權宣告文字
 */
makoci.layer.AGMS.TiledLayer = function(url, copyright, ImageMapTypeOptions){
	
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || copyright;
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ copyright;
	ImageMapTypeOptions.copyright=copyright;
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	
	
	ImageMapTypeOptions.getTileUrl = function(a, b) {
		return url + "/tile/" + b + "/" + a.y + "/" + a.x;
	};
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
}


/**
 * 
 * @param {String} url
 * @param {String} type 包括"tiled" or "dynamic" 設定此agms的service屬於"tiledMapService" or "dynamicMapService"
 * @param {String} copyright
 * @param {Object} ImageMapTypeOptions
 */
makoci.layer.AGMS.MapType = function(url, type, copyright, ImageMapTypeOptions){
	if(!url || url==""){
		console.log('[ERROR]makoci.layer.AGMS.MapType: url錯誤，請重新設定！');
		return;
	}
	
	if(!type || type==""){
		console.log('[ERROR]makoci.layer.AGMS.MapType: type錯誤，請重新設定！');
		return;
	}
	
	var coordinate=new makoci.util.coordinate();
	var bbox={};
	
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || copyright;
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ copyright;
	ImageMapTypeOptions.copyright=copyright;
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	ImageMapTypeOptions.getTileUrl=function(a, b){
		//判斷tiled or dynamic
		switch(type){
			case "tiled":
				return url + "/tile/" + b + "/" + a.y + "/" + a.x;
			break;
			case "dynamic":
				return (function(){
					bbox=coordinate.tileToLatLngBound(a.x, a.y,b);
					
					return url + 
							 '/export?' + 'f=image&bbox=' + bbox.xmin+','+bbox.ymin+','+bbox.xmax+','+bbox.ymax+
						   	'&size=256,256&imageSR=102113&bboxSR=4326&format=png32&layerDefs=&layers=&transparent=true'
						   ;
				})();
			break;
		}
	}
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
}


/**
 * 透過GroundOverlay來套疊ArcGIS Map Service, 相較於makoci.layer.AGMS.MapType速度會比較慢一些
 * @param {GMap} GMAP3
 * @param {String} url
 */
makoci.layer.AGMS.MapOverlay=function(GMAP3, url){
	if(!GMAP3 || url=="" || !url){
		console.log('[ERROR]makoci.layer.AGMS.MapOverlay: GMAP3, URL設定錯誤，請重新設定！');
		return;	
	}
	
	var me=new google.maps.GroundOverlay('', GMAP3.getBounds(), {opacity:0.75});

	me.getImageURL=function(){
		//get bbox
		me.bbox=(function(){
			var bounds=me.bounds;
			return {
				xmin:bounds.getSouthWest().lng(),
				ymin:bounds.getSouthWest().lat(),
				xmax:bounds.getNorthEast().lng(),
				ymax:bounds.getNorthEast().lat(),
				sw_latlng:bounds.getSouthWest(),
				ne_latlng:bounds.getNorthEast()
			}	
		})();
		
		//get json
		var json_url=url+'/export?f=json&bbox='+me.bbox.xmin+','+me.bbox.ymin+','+me.bbox.xmax+','+me.bbox.ymax+'&size='+$(GMAP3.getDiv()).width()+','+$(GMAP3.getDiv()).height()+'&imageSR=102113&bboxSR=4326&layerDefs=&layers=&transparent=true&callback=?';
		$.getJSON(json_url,function(json){
			if(json.href){
				me.url=json.href;
			}else{
				console.log('[ERROR]makoci.layer.AGMS.MapOverlay: 取AGMS json時產生錯誤！');
				return;
			}
		});
	}
	
	//執行getImageURL
	me.getImageURL();
	
	//備份setMap()至setMap2並改寫setMap;
	me.setMap2=me.setMap;
	me.setMap=function(map){
		if(me.url==''){
			setTimeout(function(){
				me.setMap(map)
			},100);
			return;
		}else{
			//console.log(me);
			me.setMap2(map);
		}
	}
	
	//當map的idel時,重新抓取image套疊
	google.maps.event.addListener(GMAP3, 'idle', function(){
		if(me.getMap){
			me.setMap(null);
			me.url='';
			me.bounds=GMAP3.getBounds();
			me.getImageURL();
			me.setMap(GMAP3);
		}
	});

	return me;
}





/**
 * 查詢 Arcgis Map Service
 * @class
 * @param {String} url 查詢的ArcGIS Map Service網址 
 * @param {GMap} g_map Google Map物件
 * @param {GLatLng}latlng 查詢的經緯度座標，GLatLng物件
 * @param {String} div_id 查詢結果顯示於DOM ID中
 */
makoci.layer.AGMS.identify = function(url, g_map, latlng, div_id) {
	//get this agms's json
	var json_url = url + "?f=json&callback=?";
	$.getJSON(json_url, function(json) {
		//get layers' information
		var layers = json.layers;

		var html = '<b>' + json.mapName + '</b><p></p><b>請選擇查詢的圖層: </b><br><select id=sel_' + div_id + " >";

		for(var i = 0, max=layers.length; i < max; i++) {
			var layer = layers[i];
			//忽略group layer
			if(layer.subLayerIds == null) {
				html += "<option value=" + i + " >" + layer.name + '</option>';
			}
		}

		html += "</select><hr><p></p><div id='result_" + div_id + "' style='width:100%' ><img src=" + img_loading + " width=250px /></div>";

		$("#" + div_id).html(html);

		//針對sel_layer_agms_id增加click event
		$("#sel_" + div_id).change(function() {
			var id = $(this).val();
			identify_AGMS(url, g_map, latlng, id, "result_" + div_id);
		});

		//預設觸發select的change事件
		$("#sel_" + div_id).trigger("change");
	});

	/**
	 * @private
	 */
	function identify_AGMS(p_url, p_map, p_latlng, p_id, p_result_id) {
		$("#" + p_result_id).html("<img src=" + img_loading + " width=250px />");

		identifyTask = new esri.arcgis.gmaps.IdentifyTask(p_url);

		// set the identify parameters
		var identifyParameters = new esri.arcgis.gmaps.IdentifyParameters();
		identifyParameters.geometry = p_latlng;
		// location where the user clicked on the map
		identifyParameters.tolerance = 3;
		identifyParameters.layerIds = [p_id];
		identifyParameters.layerOption = "all";
		identifyParameters.bounds = p_map.getBounds();
		identifyParameters.width = $(p_map.getDiv()).width();
		identifyParameters.height = $(p_map.getDiv()).height();

		// execute the identify operation
		identifyTask.execute(identifyParameters, function(response, error) {// function to be called when the result is available
			// display error message (if any) and return
			if(error) {
				alert("Error " + error.code + ": " + (error.message || (error.details && error.details.join(" ")) || "Unknown error" ));
				return;
			}

			// note that the location where the user clicked on the map (latLng) is visible in this function through closure
			// aggregate the result per map service layer
			var idResults = response.identifyResults;

			//先判斷是否有identify植回來
			if(idResults.length == 0) {
				$("#" + p_result_id).html('no identify data');
				return;
			} else {
				var html = "共" + idResults.length + "筆資料<p></p>";
				html += "<table border=1 width=98% style='font-size:90%; border-collapse:collapse;'>";

				//將各layer的結果塞回
				for(var i = 0, max=idResults.length; i < max; i++) {
					var feature = idResults[i].feature;

					//抓取所有欄位名稱
					if(i == 0) {
						html += "<tr>";
						for(var key in feature.attributes) {
							html += "<td bgcolor=#999999><b>" + key + "</b></td>";
						}
						html += "</tr>";
					}

					//讀attribute的值
					html += "<tr>";
					for(var key in feature.attributes) {
						html += "<td>" + feature.attributes[key] + "</td>";
					}
					html += "</tr>";
				}

				html += "</table>";
			}

			//show info window
			$("#" + p_result_id).html(html);
		});
	}
}
//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * OVI(Nokia) map
 * @class
 */
makoci.layer.OVI = function(ImageMapTypeOptions){
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || 'OVI Map';
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ 'OVI MAP';
	ImageMapTypeOptions.copyright='OVI Map';
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	
	
	ImageMapTypeOptions.getTileUrl = function(a, b) {
		return "http://e.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/terrain.day/" + b + "/" + a.x + "/" + a.y + "/256/png8";
	};
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
};


//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * CloudMade 地圖
 * @class
 */
makoci.layer.CLOUDMADE = function(ImageMapTypeOptions){
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || 'Cloudmade';
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ 'Cloudmade';
	ImageMapTypeOptions.copyright='Cloudmade';
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	
	
	ImageMapTypeOptions.getTileUrl = function(a, b) {
		return "http://c.tile.cloudmade.com/3d1e3cc5822c451eb72c7ae9ac3468b1/999/256/" + b + "/" + a.x + "/" + a.y + ".png";
	};
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
};

//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * WMS
 * @class
 * @param {String} url WMS的網址，網址必須包含layers, srs等資訊。 
 * @param {String} copyright 此WMS的copyright
 * @param {String} uuid (optional) makoci的uuid,讀取cache在makoci中的圖 
 * @param {ImageMapTypeOptions}
 */
makoci.layer.WMS = function(url, copyright, uuid, ImageMapTypeOptions){
	this.url = url;
	this.uuid = uuid;
	
	//URL
		this.base_url = "";
		switch (String(this.url).split("?").length) {
			case 1:
				this.base_url = String(this.url).split("?")[0] + "?";
				break;
			case 2:
				this.base_url = String(this.url).split("?")[0] + "?";
				break;
			case 3:
				this.base_url = String(this.url).split("?")[0] + "?" + String(this.url).split("?")[1] + "?";
				break;
			default:
				this.base_url = "";
		}
		if(this.base_url == "") {
			alert("url:" + this.base_url + " 有問題，請重新輸入");
			return;
		}

		var wms = String(this.url) + "&";

		//LAYERS
		this.layers = "0";
		//如果有layers
		if(wms.toUpperCase().search("LAYERS=") != -1) {
			this.layers = wms.substring(wms.toUpperCase().indexOf("LAYERS=") + 7, wms.indexOf("&", wms.toUpperCase().indexOf("LAYERS=")));
		}

		if(this.layers == "") {
			alert("layers有問題，請重新輸入！");
			return;
		}

		//srs
		this.srs = "EPSG:4326";
		if(wms.toUpperCase().search("SRS=") != -1) {
			this.srs = wms.toUpperCase().substring(wms.toUpperCase().indexOf("SRS=") + 4, wms.toUpperCase().indexOf("&", wms.toUpperCase().indexOf("SRS=")));
			this.srs = this.srs.toUpperCase();
		};

		//轉大寫, 除了layers之外的，可以變成大寫，不會有辨認上的問題
		//wms=String(wms).toLowerCase();

		//FORMAT
		this.format = "image/png";
		if(wms.toUpperCase().search("FORMAT=") != -1) {
			this.format = wms.substring(wms.toUpperCase().indexOf("FORMAT=") + 7, wms.indexOf("&", wms.toUpperCase().indexOf("FORMAT=")));
		}
		//有些format變成大寫 會有問題，改成小寫
		//format="image/png";

		//version
		this.version = "1.1.0";
		if(wms.toUpperCase().search("VERSION=") != -1) {
			this.version = wms.substring(wms.toUpperCase().indexOf("VERSION=") + 8, wms.indexOf("&", wms.toUpperCase().indexOf("VERSION=")))
		};

		//servicename
		this.servicename = "";
		if(wms.toUpperCase().search("SERVICENAME=") != -1) {
			this.servicename = wms.substring(wms.toUpperCase().indexOf("SERVICENAME=") + 12, wms.indexOf("&", wms.toUpperCase().indexOf("SERVICENAME=")))
		};

		//style
		this.styles = "";
		if(wms.toUpperCase().search("STYLES=") != -1) {
			this.styles = wms.substring(wms.toUpperCase().indexOf("STYLES=") + 7, wms.indexOf("&", wms.toUpperCase().indexOf("STYLES=")))
		};

		//SLD
		this.sld = '';
		if(wms.toUpperCase().search("SLD=") != -1) {
			this.sld = wms.substring(wms.toUpperCase().indexOf("SLD=") + 4, wms.indexOf("&", wms.toUpperCase().indexOf("SLD=")))
		};
		//renew
		this.renew=false;
		if(wms.toUpperCase().search("RENEW=") != -1) {
			this.renew = wms.substring(wms.toUpperCase().indexOf("RENEW=") + 6, wms.indexOf("&", wms.toUpperCase().indexOf("RENEW=")))
		};
		

		console.log("<<wms=" + wms + ">> url= " + this.base_url + "   layers= " + this.layers + "    format= " + this.format + "     version= " + this.version + "     servicename=" + this.servicename + "     srs=" + this.srs + "     styles=" + this.styles + "     sld=" + this.sld);
	
	
	//預設的imageMapTypeOptions
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || copyright;
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.alt=ImageMapTypeOptions.alt || "Map Data： "+ copyright;
	ImageMapTypeOptions.copyright=copyright;
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	ImageMapTypeOptions.that=this;
	ImageMapTypeOptions.getTileUrl = this.getWMSURL;
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
}


makoci.layer.WMS.prototype.getWMSURL=function(a,b){
			var MAGIC_NUMBER = 6356752.3142,
				WGS84_SEMI_MAJOR_AXIS = 6378137.0,
				WGS84_ECCENTRICITY = 0.0818191913108718138,
				DEG2RAD = 0.0174532922519943,
				PI = 3.14159267,
				FORMAT_DEFAULT = "image/png",
				MERC_ZOOM_DEFAULT = 15,
				taiwan_coordinate = new makoci.util.coordinate(),
				that=this.that;
				
			if(that.myMercZoomLevel == undefined) {
				that.myMercZoomLevel = MERC_ZOOM_DEFAULT;
			}
	
			if(that.myFormat == undefined) {
				that.myFormat = FORMAT_DEFAULT;
			}
	
			
			//if (typeof(window['that.myStyles'])=="undefined") that.myStyles="";
//			var lULP = new google.maps.Point(a.x * 256, (a.y + 1) * 256);
//			var lLRP = new google.maps.Point((a.x + 1) * 256, a.y * 256);
			var lUL = taiwan_coordinate.pixelToLatLng(a.x * 256, (a.y + 1) * 256, b);
			var lLR = taiwan_coordinate.pixelToLatLng((a.x + 1) * 256, a.y * 256, b);
			
			// switch between Mercator and DD if merczoomlevel is set
			// NOTE -it is now safe to use Mercator exclusively for all zoom levels (if your WMS supports it)
			// so you can just use the two lines of code below the IF (& delete the ELSE)
			// drg & doq are topozone layers--- they don't work with epsg:54004
			//if (that.myLayers!="drg" && that.myLayers!="doq") {
			//	var lBbox=dd2MercMetersLng(lUL.x)+","+dd2MercMetersLat(lUL.y)+","+dd2MercMetersLng(lLR.x)+","+dd2MercMetersLat(lLR.y);
			//Change for GeoServer - 41001 is mercator and installed by default.
			//	var lSRS="EPSG:54004";
			//} else {
			var lBbox = lUL.lng + "," + lUL.lat + "," + lLR.lng + "," + lLR.lat;
			//var lSRS="EPSG:4326";
			
			//判斷傳入的srs屬於何種座標系統
			switch (that.srs) {
				//TWD97
				case "EPSG:3826":
					//將WGS84的bbox座標轉換成twd97
					var twd97_sw = taiwan_coordinate.WGS84ToTWD97(lUL.lat, lUL.lng);
					var twd97_ne = taiwan_coordinate.WGS84ToTWD97(lLR.lat, lLR.lng);
					lBbox = twd97_sw.x + "," + twd97_sw.y + "," + twd97_ne.x + "," + twd97_ne.y;
					break;
	
				//TWD97
				case "EPSG:102443":
					//將WGS84的bbox座標轉換成twd97
					var twd97_sw = taiwan_coordinate.WGS84ToTWD97(lUL.lat, lUL.lng);
					var twd97_ne = taiwan_coordinate.WGS84ToTWD97(lLR.lat, lLR.lng);
					lBbox = twd97_sw.x + "," + twd97_sw.y + "," + twd97_ne.x + "," + twd97_ne.y;
					break;
	
				//TWD67
				case "EPSG:3828":
					//將WGS84的bbox座標轉換成twd67
					var twd67_sw = taiwan_coordinate.WGS84ToTWD67(lUL.lat, lUL.lng);
					var twd67_ne = taiwan_coordinate.WGS84ToTWD67(lLR.lat, lLR.lng);
					lBbox = twd67_sw.x + "," + twd67_sw.y + "," + twd67_ne.x + "," + twd67_ne.y;
					break;
	
				//TWD67
				case "EPSG:NONE":
					//將WGS84的bbox座標轉換成twd67
					var twd67_sw = taiwan_coordinate.WGS84ToTWD67(lUL.lat, lUL.lng);
					var twd67_ne = taiwan_coordinate.WGS84ToTWD67(lLR.lat, lLR.lng);
					lBbox = twd67_sw.x + "," + twd67_sw.y + "," + twd67_ne.x + "," + twd67_ne.y;
					break;
	
				case "EPSG:4326":
					//do nothing
					break;
					
				case "EPSG:900913":
					//將wgs84的bbox座標轉換成900913: google的meter
					var googleMeter_sw = taiwan_coordinate.latlngToMeter(lUL.lat, lUL.lng);
					var googleMeter_ne = taiwan_coordinate.latlngToMeter(lLR.lat, lLR.lng);
					lBbox = googleMeter_sw.x + "," + googleMeter_sw.y + "," + googleMeter_ne.x + "," + googleMeter_ne.y;
				 break;
	
				default:
					console.log("座標系統srs= " + that.srs + "錯誤，無法辨識!");
					return;
					break;
			}
	
			//}
			var wms_url = that.base_url;
			wms_url += "REQUEST=GetMap";
			wms_url += "&SERVICE=WMS";
			wms_url += "&SERVICENAME=" + that.servicename;
			wms_url += "&VERSION=1.1.1";
			wms_url += "&LAYERS=" + that.layers;
			wms_url += "&STYLES=" + that.styles;
			wms_url += "&FORMAT=" + that.format;
			wms_url += "&BGCOLOR=0xFFFFFF";
			wms_url += "&TRANSPARENT=TRUE";
			wms_url += "&SRS=" + that.srs;
			wms_url += "&BBOX=" + lBbox;
			wms_url += "&WIDTH=256";
			wms_url += "&HEIGHT=256";
			wms_url += "&reaspect=false";
			wms_url += "&tiled=true";

			//alert(" url is " + lURL);
	
			//假如有SLD,才指定styles
			if(that.sld != '' && that.sld && that.styles != '' && that.styles) {
				//wms_url+="&STYLES="+that.myStyles;
				wms_url += "&SLD=" + that.sld;
			}
	
			//如果有wms的uuid的話，就透過makoci有建立wms 的cache proxy
			//透過此可以cache 圖檔 如果沒有圖檔的話  此proxy server會再跟wms server要圖
			if(that.uuid != "" && that.uuid != null && that.uuid != undefined) {
				if(that.renew){
					wms_url = "http://www.makoci.com/tiles/wms/" + that.uuid + "/" + b + "/" + a.x + "/" + a.y + "?renew=true&url=" + encodeURIComponent(wms_url);
				}else{
					wms_url = "http://www.makoci.com/tiles/wms/" + that.uuid + "/" + b + "/" + a.x + "/" + a.y + "?url=" + encodeURIComponent(wms_url);
				}
			}
			
			return wms_url;
			
			
			/**
			 * @private
			 * @param {Object} p_lng
			 */
			function dd2MercMetersLng(p_lng) {
				return WGS84_SEMI_MAJOR_AXIS * (p_lng * DEG2RAD);
			}
			
			/**
			 * @private
			 * @param {Object} p_lat
			 */
			function dd2MercMetersLat(p_lat) {
				var lat_rad = p_lat * DEG2RAD;
				return WGS84_SEMI_MAJOR_AXIS * Math.log(Math.tan((lat_rad + PI / 2) / 2) * Math.pow(((1 - WGS84_ECCENTRICITY * Math.sin(lat_rad)) / (1 + WGS84_ECCENTRICITY * Math.sin(lat_rad))), (WGS84_ECCENTRICITY / 2)));
			}
}


/**
 * 查詢 WMS的資料
 * @class
 * @param {String} url 查詢的WMS網址 
 * @param {GMap} g_map GMAP物件
 * @param {GLatLng} latlng 查詢點位GLatLng
 * @param {String} div_id 查詢結果顯示於DOM id中
 */
makoci.layer.WMS.identify = function(url, g_map, latlng, div_id) {
	url = url + "&";

	//get queryLayers
	var queryLayers = 0;
	//如果有layers
	if(url.search("Layers=") != -1) {
		queryLayers = url.substring(url.indexOf("Layers=") + 7, url.indexOf("&", url.indexOf("Layers=")));
	}

	if(url.search("LAYERS=") != -1) {
		queryLayers = url.substring(url.indexOf("LAYERS=") + 7, url.indexOf("&", url.indexOf("LAYERS=")));
	}

	if(url.search("layers=") != -1) {
		queryLayers = url.substring(url.indexOf("layers=") + 7, url.indexOf("&", url.indexOf("layers=")));
	}

	//get srs
	var srs = "EPSG:4326";
	if(url.toUpperCase().split('SRS=').length > 1) {
		srs = url.toUpperCase().split('SRS=')[1].split('&')[0];
		srs = srs.toUpperCase();
	}

	var bbox = g_map.getBounds().getSouthWest().lng() + "," + g_map.getBounds().getSouthWest().lat() + "," + g_map.getBounds().getNorthEast().lng() + "," + g_map.getBounds().getNorthEast().lat();
	//判斷srs
	//TWD97
	if(srs == "EPSG:3826" || srs == "EPSG:102443") {
		var twd97_sw = taiwan_coordinate.WGS84ToTWD97(g_map.getBounds().getSouthWest().lat(), g_map.getBounds().getSouthWest().lng());
		var twd97_ne = taiwan_coordinate.WGS84ToTWD97(g_map.getBounds().getNorthEast().lat(), g_map.getBounds().getNorthEast().lng());
		bbox = twd97_sw.x + "," + twd97_sw.y + "," + twd97_ne.x + "," + twd97_ne.y;
	}

	//TWD67
	if(srs == "EPSG:3828" || srs == "EPSG:NONE") {
		var twd67_sw = taiwan_coordinate.WGS84ToTWD67(g_map.getBounds().getSouthWest().lat(), g_map.getBounds().getSouthWest().lng());
		var twd67_ne = taiwan_coordinate.WGS84ToTWD67(g_map.getBounds().getNorthEast().lat(), g_map.getBounds().getNorthEast().lng());
		bbox = twd67_sw.x + "," + twd67_sw.y + "," + twd67_ne.x + "," + twd67_ne.y;
	}

	//將此點的屬性 抓回
	//判斷x,y
	var x = Math.round(makoci.overlayView.getProjection().fromLatLngToContainerPixel(latlng).x);
	var y = Math.round(makoci.overlayView.getProjection().fromLatLngToContainerPixel(latlng).y);

	//jquery ajax
	//似乎ajax都被crossdomain被限制
	//不管要抓html, xml, json都無法是crossdomain的來抓, 只能抓local端！雖然都能夠正常執行，但是結果就是null 回不到success
	//但是似乎用xdomainajax.js中的YQL方法，改寫成jsonp的方式, 但是速度會比較慢
	$.ajax({
		type : "GET",
		url : url.split("?")[0],
		data : {
			request : "getFeatureInfo",
			x : x,
			y : y,
			srs : srs,
			service : "WMS",
			version : "1.1.1",
			format : "image/png",
			bbox : bbox,
			info_format : "text/html",
			layers : queryLayers,
			query_layers : queryLayers,
			feature_count : 10,
			width : $(g_map.getDiv()).width(), //計算目前map的div寬度
			height : $(g_map.getDiv()).height() //計算目前map的div高度
		},
		//					async: false,
		//dataType:"json",
		cache : false,
		success : function(result) {
			//info window
			//如果直接將result中的responseText丟給infowindow,
			//有些html的tag會造成錯誤
			//所以先將result丟給div中，再讓infowindow去讀此div的html就可以正常
			//				var response='查無資料';
			//				if(result.responseText!=null){
			//					response=result.responseText;
			//				}
			$("#" + div_id).html(result.responseText);
			//g_map.openInfoWindowHtml(latlng, $("#div_identify_result").html());
		},
		failure : function(msg) {
			alert('identify failure');
		}
	});
	//end ajax
}
/**
 * 取得WMS的圖例。但是只支援具有getLegendGraphic的WMS
 * @class
 * @param {String} url WMS的網址
 * @param {Boolean} showName 是否要顯示圖層的名稱  
 */
makoci.layer.WMS.getLegend = function(url, showName) {
	//先從url中得到layer name
	url = url + "&";

	//get queryLayers
	var queryLayers = "0";
	//如果有layers
	if(url.search("Layers=") != -1) {
		queryLayers = url.substring(url.indexOf("Layers=") + 7, url.indexOf("&", url.indexOf("Layers=")));
	}
	if(url.search("LAYERS=") != -1) {
		queryLayers = url.substring(url.indexOf("LAYERS=") + 7, url.indexOf("&", url.indexOf("LAYERS=")));
	}
	if(url.search("layers=") != -1) {
		queryLayers = url.substring(url.indexOf("layers=") + 7, url.indexOf("&", url.indexOf("layers=")));
	}

	//判斷queryLayers有多少layer
	var html = '';
	for(var i = 0; i < queryLayers.split(',').length; i++) {
		var src = url.split("?")[0] + '?request=getLegendGraphic&service=WMS&version=1.1.1&layer=' + queryLayers.split(',')[i] + "&format=image/png";

		if(showName) {
			html += "<img src='" + src + "' />&nbsp; " + queryLayers.split(',')[i] + "<br>";
		} else {
			html += "<img src='" + src + "' /><br>";
		}
	}
	return html;
}
//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * KML
 * @class
 */
makoci.layer.KML = function() {
};

/**
 * 取得KML的圖例
 * @class
 * @param {String} url KML的網址 
 * @param {String}id DOM id, 圖例傳回至DOM id中
 * @param {Function} callback callback(包含圖例的html, DOM id)
 */
makoci.layer.KML.getLegend = function(url, id, callback) {
	var html;
	$.getJSON("ws/utility/kml_legend?url=" + url, function(json) {
		if(json && json != '') {
			html = "<ul style='list-style:none; margin:0px; padding:0px'>";
			$.each(json, function(i, item) {
				html += "<li style='padding-left:2px; margin:0px;'>"
				html += "<img src='" + item.href + "' style='width:24px;vertical-align:middle' />"
				html += "&nbsp;" + item.id + "</li>";
			});
			html += "</ul>";
		} else {
			html = "<span>Legend is not supported in this service.<br>此服務尚未支援圖例</span>";
		}
		return callback(html, id);
	});
}
//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
//google docs
/**
 * 讀取Google Docs中的資料
 * @class
 * @param {String} key Google Docs文件的Key
 * @param {String} wsID Google Docs的sheetID
 */
makoci.layer.GOOGLEDOCS = function(key, wsID){
	if (!key) {alert('[ERROR] 請輸入Google Docs的Key');return}
	if (!wsID) {wsID = 'od6'}
	
	this.key = key;
	this.wsID = wsID;
}
/**
 * 讀取Google Docs資料並轉換為GMarker v3
 * @param {Object} field_lat
 * @param {Object} field_lng
 * @param {Object} options 包括options.fieldName指定某個欄位作為名稱; options.description指定某個欄位作為描述的內容; options.legend指定某個欄位作為圖例的來源（只接受URL）
 * @param {Function} callback callback(GMarker[], GLatLngBounds)
 */
makoci.layer.GOOGLEDOCS.prototype.getGMarkers=function(field_lat, field_lng, options, callback){
		var gmarkers=[];
		
		if(field_lat=='undefined' || field_lng=='undefined' || !field_lat || !field_lng || field_lat=='' || field_lng==""){
			console.log('[ERROR] Google Docs 經緯度的欄位並未給予，請重新輸入!');
			return;
		}
		if(!callback){console.log('[ERROR] Google Docs並未給予callback function, 請重新輸入');return;}
		
		var options_name, options_description, options_legend, options_lat, options_lng;
		if(options){
			if(options.fieldName){options_name=options.fieldName}
			if(options.fieldDescription){options_description=options.fieldDescription}
			if(options.fieldLegend){options_legend=options.fieldLegend};
		}
		
		var url='https://spreadsheets.google.com/feeds/list/' + this.key +'/' + this.wsID + '/public/values?alt=json-in-script&callback=?';
		
		$.getJSON(url, function(json){
			if(json.feed.entry.length==0){console.log('[ERROR] 此Google Docs無資料，請確認！'); return;}
			
			var markers=[];
			var bounds = new google.maps.LatLngBounds();
			for(var i=0;i<json.feed.entry.length;i++){
				var record=json.feed.entry[i];
					
				//description		
				var description="<font style='font-size:80%'>";
				if(options_description){
					description=record["gsx$"+options_description].$t;
				}else{
					for(fieldName in record){
						if(fieldName.split('gsx$').length>1 && fieldName!='gsx$timestamp'){
							description+= "<b>"+fieldName + "</b>: " + record[fieldName].$t + '<br>';
						}
					}
					description +="</font>";
				}
				
				
				//icon
				var iconURL='';
				if(options_legend){
					if(record['gsx$'+options_legend].$t.length>5){
						iconURL=record['gsx$'+options_legend].$t;
					}
				};
				
				//marker
				var latlng=new google.maps.LatLng(parseFloat(record["gsx$"+field_lat].$t), parseFloat(record["gsx$"+field_lng].$t));
				var marker;
				if (options_name) {
					marker=makoci.util.createMarker(latlng, description, {title: record['gsx$' + options_name].$t, icon:iconURL});
				}else{
					marker=makoci.util.createMarker(latlng, description, {icon:icon});
				}
				
				markers.push(marker);
				bounds.extend(latlng);	
			
			}
			callback(markers, bounds);
		});
		
}


/**
 * @private
 * 讀取Google Docs資料並轉換為GMarker v3。only for COPSD project
 * @param {Object} field_lat
 * @param {Object} field_lng
 * @param {Object} options 包括options.fieldName指定某個欄位作為名稱; options.description指定某個欄位作為描述的內容; options.legend指定某個欄位作為圖例的來源（只接受URL）; options.iconSuccess傳入GIcon，指定成功案例的Icon; options.iconNew傳入GIcon，指定新增案例的Icon; options.iconProgress傳入GIcon，指定執行中案例的Icon
 * @param {Function} callback callback(GMarker[], GLatLngBounds)
 * @param {String} click_volunteer 當使用者按下voluteer的click button時所要觸發的function String。
 */
makoci.layer.GOOGLEDOCS.prototype.getGMarkers_COPSD=function(field_lat, field_lng, options, callback, click_volunteer){
		var gmarkers=[];
		
		if(field_lat=='undefined' || field_lng=='undefined' || !field_lat || !field_lng || field_lat=='' || field_lng==""){
			console.log('[ERROR] Google Docs 經緯度的欄位並未給予，請重新輸入!');
			return;
		}
		if(!callback){console.log('[ERROR] Google Docs並未給予callback function, 請重新輸入');return;}
		
		//options
		var options_name, options_description, options_legend, options_lat, options_lng, options_iconSuccess, options_iconProgress, options_iconNew;
		if(options){
			if(options.fieldName){options_name=options.fieldName}
			if(options.fieldDescription){options_description=options.fieldDescription}
			if(options.fieldLegend){options_legend=options.fieldLegend};
			if(options.iconSuccess){options_iconSuccess=options.iconSuccess};
			if(options.iconProgress){options_iconProgress=options.iconProgress};
			if(options.iconNew){options_iconNew=options.iconNew};
		}
		
		var url='https://spreadsheets.google.com/feeds/list/' + this.key +'/' + this.wsID + '/public/values?alt=json-in-script&callback=?';
		
		$.getJSON(url, function(json){
			if(json.feed.entry.length==0){console.log('[ERROR] 此Google Docs無資料，請確認！'); return;}
			
			var markers=[];
			var bounds = new google.maps.LatLngBounds();
			for(var i=0;i<json.feed.entry.length;i++){
				var record=json.feed.entry[i];
					
				//description		
				var properties={};
				for(fieldName in record){
						if(fieldName.split('gsx$').length>1 && fieldName!='gsx$timestamp'){
							//將欄位加到properties的array當中
							properties[fieldName.split('gsx$')[1]]=record[fieldName].$t;
						}
				}
							
				//icon
				var size=new google.maps.Size(22,22);
				var icon = new google.maps.MarkerImage('http://www.makoci.com/images/iSDSS/circle_red.png',null, null, null, size)
			
				
				if(options_iconNew){icon=options_iconNew};
				
				if(options_legend){
					if(record['gsx$'+options_legend].$t.length>0){
						switch (record['gsx$'+options_legend].$t){
							case "1": //成功
								if(options_iconSuccess){
									icon=options_iconSuccess;
								}else{
									icon=new google.maps.MarkerImage('http://www.makoci.com/images/iSDSS/circle_green.png',null, null, null, size);
								}
							break;
							case "2": //執行中
								if(options_iconProgress){
									icon=options_iconProgress;
								}else{
									icon=new google.maps.MarkerImage('http://www.makoci.com/images/iSDSS/circle_yellow.png',null, null, null, size);
								}
							break;
						}
					}
				};
				
				//marker
				var latlng=new google.maps.LatLng(parseFloat(record["gsx$"+field_lat].$t), parseFloat(record["gsx$"+field_lng].$t));
				var marker;
				if (options_name) {
					//marker=createMarker(latlng, record['gsx$' + options_name].$t, "", icon);
					marker=makoci.util.createMarker(latlng, "", {title:record['gsx$' + options_name].$t, icon:icon});
				}else{
					marker=makoci.util.createMarker(latlng, "", {icon:icon});
				}
				
				//properties
				marker.properties=properties;
				
				markers.push(marker);
				bounds.extend(latlng);	
			}
			callback(markers, bounds);
		});
		
		
}
	


//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
//Taipei_BUS
/**
 * 介接台北市交通局公車資訊
 * @class
 */
makoci.layer.TAIPEI_BUS = function() {
	//因為在同一個domain之下，抓kml, 不需要proxy
	this.base_url = 'http://www.makoci.com/ws/taipei_bus/';
	
	/**
	* 抓取站牌的json url
	* @param {String} routeName 路線名稱
	*/
	this.getStopUrl = function(routeName) {
		return taipei_bus_stop(this.base_url, routeName);
	}
	
	/**
	* 抓取路線的json url
	* @param {String} routeName 路線名稱
	*/
	this.getRouteUrl = function(routeName) {
		return taipei_bus_route(this.base_url, routeName);
	}
	
	/**
	* 抓取公車基本資料的json url
	* @param {String} routeName 路線名稱
	*/
	this.getBusDataUrl = function(routeName) {
		return taipei_bus_data(this.base_url, routeName);
	}
	/**
	 * @private
	 */
	function taipei_bus_route(base_url, routeName) {
		return base_url + 'route?format=json&routeZh=' + routeName;
	}

	/**
	 * @private
	 */
	function taipei_bus_stop(base_url, routeName) {
		return base_url + 'stop?routeZh=' + routeName;
	}

	/**
	 * @private
	 */
	function taipei_bus_data(base_url, routeName) {
		return base_url + 'bus_data?routeZh=' + routeName;
	}

}
//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * 介接Google Earth Enterprise圖資
 * @class
 * @param {Object} gee_url
 * @param {String} copyright
 * @param {Function} callback 傳回GEE的definition
 */
makoci.layer.GEE = function(gee_url, copyright, callback){
	if (!gee_url) {
		alert('[ERROR] 尚未給予GEE URL，請重新輸入！');
		return
	}
	
	this.serverURL = gee_url;
	this.copyright = copyright;
	var that = this;
	
	$.getScript(gee_url + '/query?request=Json&var=geeServerDefs', function(){
		that.geeDef = geeServerDefs;
		callback(that.geeDef);
	});
}

	
/**
 * 取回GEE所有的資料清單
 */
makoci.layer.GEE.prototype.getLayers=function(){
	return this.geeDef.layers;
}
	
/**
 * 取回GEE資料清單定義
 */
makoci.layer.GEE.prototype.getDef=function(){
	return this.geeDef;
}


/**
 * 取得 ImageMapType
 * @param {Number} num 在GEE Definition中第幾個layer
 * @param {Object} GTileLayerOptions  
 */
makoci.layer.GEE.prototype.getImageMapType = function(num, ImageMapTypeOptions) {
	//預設的imageMapTypeOptions
	if(!ImageMapTypeOptions){ImageMapTypeOptions={}}
	ImageMapTypeOptions.maxZoom=ImageMapTypeOptions.maxZoom || 18;
	ImageMapTypeOptions.minZoom=ImageMapTypeOptions.minZoom || 1;
	ImageMapTypeOptions.name=ImageMapTypeOptions.name || this.copyright;
	ImageMapTypeOptions.opacity=ImageMapTypeOptions.opacity || 0.75;
	ImageMapTypeOptions.copyright=this.copyright;
	ImageMapTypeOptions.tileSize=ImageMapTypeOptions.tileSize || new google.maps.Size(256, 256);
	ImageMapTypeOptions.that=this;


	ImageMapTypeOptions.getTileUrl = function(a, b) {
		var that=ImageMapTypeOptions.that;
		return that.serverURL + "/query?request=" + that.getLayers()[num]["requestType"] + "&channel=" + that.getLayers()[num]["id"] + "&version=" + that.getLayers()[num]["version"] + "&x=" + a.x + "&y=" + a.y + "&z=" + b;
	};
	
	return makoci.layer.createImageMapType(ImageMapTypeOptions);
}
	


//-------------------------------------------------------------------------------------------------------------------------------------------------

//**************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------
//AGGP class
//var _AGGP_outputGFeatures=[];
makoci.layer.AGGP_inputGOverlay = {};

/**
 * ArcGIS Geoprocessing Service
 * @class
 * @param {GMap} map GoogleMap物件
 * @param {String} url ArcGIS Geoprocessing Service網址
 */
makoci.layer.AGGP = function(map, url){
	var _outputGFeatures = [];
	
	//properties
	this.url=url;
	this.gmap=map;
	this.inputs=[];
	this.outputs=[];
	this.json=null;
	this.name='';
	this.executeCallback=null;
	this.domID_msg='';
	
	this.img={
		width:'28px',
		height:'28px',
		point:'http://dl.dropbox.com/u/6274550/images/01.point.png',
		pointHover:'http://dl.dropbox.com/u/6274550/images/01.point_m.png',
		polyline:'http://dl.dropbox.com/u/6274550/images/02.polyline.png',
		polylineHover:'http://dl.dropbox.com/u/6274550/images/02.polyline_m.png',
		polygon:'http://dl.dropbox.com/u/6274550/images/03.polygon.png',
		polygonHover:'http://dl.dropbox.com/u/6274550/images/03.polygon_m.png'
	};
	
	//icon
	new google.maps.MarkerImage('http://gmaps-samples.googlecode.com/svn/trunk/markers',null, null, null, new google.maps.Size(20,34))

	//style
	this.fillStyle={
		mouseover:{color: '#ff0000',opacity: 0.3},
		mouseout:{color: '#0000ff',opacity: 0.3}
	};
	this.strokeStyle={
		mouseover:{color: '#0000ff',weight: 4,opacity: 0.5},
		mouseout:{color: '#ff0000',weight: 4,opacity: 0.5}
	};
	this.tr_mouseoverColor = '#cccccc';
	

	//重設參數
	makoci.layer.AGGP_inputGOverlay = {};
	//makoci.layer.markerManager = new MarkerManager(this.gmap);
}


/**
 * 讀取此ArcGIS Geoprocessing Service的metadata json
 * @param {Object} jsoncallback
 */
makoci.layer.AGGP.prototype.loadJSON = function(jsoncallback) {	
		if(jsoncallback == '' || jsoncallback == null) {
			alert('請先給予_loadAGGPJson的callback function');
			return;
		}
		
		//將所有變數清空
		//makoci.layer.markerManager.clearMarkers();
		
		var me=this;
		var url= me.url + "?f=json&callback=?"
		
		$.getJSON(url, function(json) {
			//properties
			me.json = json;
			me.name = json.name;
			
			var innerHTML = "<b>Input Params from the Task WS:</b><br><table border=1 class=c><tr><td>";

			for(var i = 0; i < json.parameters.length; i++) {
				//如果是inputParameter
				if(json.parameters[i].direction == "esriGPParameterDirectionInput") {
					me.inputs.push(getInput(json.name, json.parameters[i]));
				}

				//如果是outputParameter
				if(json.parameters[i].direction == "esriGPParameterDirectionOutput") {
					me.outputs.push({name:json.parameters[i].name, type:json.parameters[i].dataType});
				}
			}
			
			if(jsoncallback){
				jsoncallback(me);
			}
		});
		
		
		/**
		 * 取得AGGP的相關input參數，並且寫出相關input所需之html
		 * @private
		 * @param {Object} wsName 此AGGP的網路服務名稱
		 * @param {Object} param parameter的參數
		 */
		function getInput(wsName, param) {
			var paramName = param.name;
			var paramType = param.dataType;
			var obj = {
				name: paramName,
				type: paramType,
				htmlID: 'input_' + wsName + "&" + paramName,
				unit:null,
				html:""
			};
			var html = '';
		
			switch (paramType) {
				case "GPLinearUnit":
					obj.unit = param.defaultValue.units;
					obj.html = "<input id='input_" + wsName + "&" + paramName + "' style='width:100px' value=" + param.defaultValue.distance + " /> " + obj.unit;
				break;
				case "GPString":
					var list = "";
		
					if(param.choicelist.length > 0) {
						list = "<select id='input_" + wsName + "&" + paramName + "' style='width:100%'>";
						for(var k = 0; k < param.choicelist.length; k++) {
							list += "<option value='" + param.choicelist[k] + "'>" + param.choicelist[k] + "</option>";
						}
						list += "</select>";
					} else {
						list = "<input type='text' style='width:95%' id='input_" + wsName + "&" + paramName + "' value='" + param.defaultValue + "'>";
					}
					obj.html = list;
				break;
				case "GPFeatureRecordSetLayer":
					var geometry = param.defaultValue.geometryType;
					switch (geometry) {
						case "esriGeometryPoint":
							obj.html = "<img width=" + me.img.width + " height=" + me.img.height + " src='" + me.img.point + "' onmouseover='this.src=\"" + me.img.pointHover + "\"' onmouseout='this.src=\"" + me.img.point + "\"' style='cursor:pointer' title='Draw Point on the map' onclick=\"makoci.util.drawFeature('" + paramName + "', 'MARKER', makoci.layer.AGGP.getGMapGeometry)\"  />";
							break;
						case "esriGeometryMultipoint":
							obj.html = "<img width=" + me.img.width + " height=" + me.img.height + " src='" +me.img.point + "' onmouseover='this.src=\"" + me.img.pointHover + "\"' onmouseout='this.src=\"" + me.img.point + "\"' style='cursor:pointer' title='Draw Point on the map' onclick=\"makoci.util.drawFeature('" + paramName + "', 'MARKER', makoci.layer.AGGP.getGMapGeometry)\" />";
							break;
						case "esriGeometryPolyline":
							obj.html = "<img width=" + me.img.width + " height=" + me.img.height + " src='" + me.img.polyline + "' onmouseover='this.src=\"" + me.img.polylineHover + "\"' onmouseout='this.src=\"" + me.img.polyline + "\"' style='cursor:pointer' title='Draw Polyline on the map' onclick=\"makoci.util.drawFeature('" + paramName + "','POLYLINE', makoci.layer.AGGP.getGMapGeometry)\" />";
							break;
						case "esriGeometryPolygon":
							obj.html = "<img width=" + me.img.width + " height=" + me.img.height + " src='" + me.img.polygon + "' onmouseover='this.src=\"" + me.img.polygonHover + "\"' onmouseout='this.src=\"" + me.img.polygon + "\"' style='cursor:pointer' title='Draw Polygon on the map' onclick=\"makoci.util.drawFeature('" + paramName + "', 'POLYGON', makoci.layer.AGGP.getGMapGeometry)\" />";
							break;
					}
				break;
				case "GPDouble":
					obj.html = "<input type='text' id='input_" + wsName + "&" + paramName + "' value=" + param.defaultValue + " >";
				break;
				case "GPLong":
					obj.html = "<input type='text' id='input_" + wsName + "&" + paramName + "' value=" + param.defaultValue + " >";
				break;
				case "GPBoolean":
		
				break;
				case "GPDate":
		
				break;
				case "GPDataFile":
		
				break;
				case "GPRasterData":
		
				break;
				case "GPRecordSet":
		
				break;
				case "GPRasterDataLayer":
		
				break;
			}
			
			return obj;
		} //end function
};
	

/**
 * 設定metadata的json
 * @param {Object} json	
 */
makoci.layer.AGGP.prototype.setJSON = function(json) {
	this.json = json
};
	
/**
 * 取得metadata的json
 */
makoci.layer.AGGP.prototype.getJSON = function() {
	return this.json
};
	
	
/**
 * 取得ArcGIS Geoprocessingservice的input values
 */
makoci.layer.AGGP.prototype.getInputValues = function() {
		var param = {};
		var inputs = this.inputs;
		var wsName = this.name
		var error = '';
	
		//check data in _inputParamNamesTypes array
		for(var i = 0; i < inputs.length; i++) {
			var paramName = inputs[i].name;
			var paramType = inputs[i].type;
	
			//get Input data and into the "param" array
			if(document.getElementById("input_" + wsName + "&" + paramName)) {
				if(document.getElementById("input_" + wsName + "&" + paramName).value) {
					var value = document.getElementById("input_" + wsName + "&" + paramName).value;
	
					switch (paramType) {
						case "GPLinearUnit":
							var linearUnit = new esri.arcgis.gmaps.LinearUnit();
							linearUnit.distance = parseFloat(value);
							linearUnit.units = inputs[i].unit;
							this.inputs[i].value = linearUnit;
							param[paramName] = linearUnit;
							break;
	
						case "GPString":
							var stringValue = document.getElementById("input_" + wsName + "&" + paramName).value;
							this.inputs[i].value = linearUnit;
							param[paramName] = stringValue;
							break;
	
						case "GPDouble":
							var doubleValue = parseFloat(document.getElementById("input_" + wsName + "&" + paramName).value);
							this.inputs[i].value = linearUnit;
							param[paramName] = doubleValue;
							break;
	
						case "GPLong":
							var longValue = parseFloat(document.getElementById("input_" + wsName + "&" + paramName).value);
							this.inputs[i].value = linearUnit;
							param[paramName] = longValue;
							break;
					}
				}
			} else {
				//如果是gometry之類的物件，則是由地圖作輸入，因此用documnet.get會抓不到對應的id
				//這邊的值，已經被塞入inputs[i].value中，當使用者在畫完地圖的時候
				if(makoci.layer.AGGP_inputGOverlay[paramName]) {
					param[paramName] = makoci.layer.AGGP_inputGOverlay[paramName];
				} else {
					error += paramName + '尚未給予值; ';
				}
			}
		}//end for
	
		return {
			param: param,
			error: error
		};
};
	
	
/**
 * 執行ArcGIS Geoprocessing service
 * @param {Object} domMsgID 顯示執行過程訊息的DOM ID
 * @param {GPResults} callback callback function(gpResults)
 */
makoci.layer.AGGP.prototype.execute = function(domMsgID, callback) {	
		this.executeCallback = callback;
		this.domID_msg = domMsgID;
	
		//清空markermanager
		if(makoci.layer.markerManager){
			makoci.layer.markerManager.clearMarkers();
		}
	
		//讀取使用者下的參數
		var result=this.getInputValues();
	
		//有錯誤
		if(result.error) {
			this.executeCallback(null, result.error);
			return;
		}
	
		//如果沒有錯誤的話
		var param = result.param;
		var me=this;

		//處理feature的geometry以及制作paramStringURL
		var paramStringURL=''
		$.each(param, function(key, value){
			if (value.features) {
				$.each(value.features, function(i, feature){
					if (feature.geometry instanceof google.maps.Marker || feature.geometry[0] instanceof google.maps.Marker || feature.geometry[0] instanceof google.maps.Polyline || feature.geometry[0] instanceof google.maps.Polygon) {
						feature.geometry = feature.geometry[0].ext_getAgsGeometry();
					}
				})
				//將geometryType改成字串
				value.geometryType = "%22" + value.geometryType + "%22";
			}
			//將單位的units改成字串
			if(value.units){value.units="%22" + value.units + "%22";}
			paramStringURL+=key + '=' + makoci.JSON.toJSON(value) + '&';
		});
		paramStringURL=paramStringURL.replace(/\"/g,""); //將字串的""去除
		
		
		//顯示執行的訊息
		if(me.domID_msg != "" && me.domID_msg){
			$("#"+me.domID_msg).fadeOut(100).html("<b><font color='#ff0000'>"+"Executing..."+"</font></b>").fadeIn(100);
		}
	
	
		//execute
		$.getJSON(this.url+'/execute?'+ paramStringURL + 'env:outSR=4326&f=json&callback=?', function(gpResults){
			if(gpResults.error){
				//if error code=400 and message==Execute operation is not allowed on this service.換成submit方式執行工作
				if(gpResults.error.code=='400' && gpResults.error.message=='Execute operation is not allowed on this service.'){
					//用asyncrous submit方式執行工作
					submit();
				}else{
					me.executeCallback(null, gpResults.error);	
					console.log('[ERROR]makoci.layer.AGGP: 執行AGGP服務錯誤. code=' + gpResults.error.code + ', message='+gpResults.error.message);
				}
			}else{
				//呈現syn成果
				$.each(gpResults.results,function(i,result){
					gpResults.results[i]=makeAGGPResult(result);
				})
				me.executeCallback(gpResults.results);	
			}
		});
		
			
		
		
		/**
		 * 執行aggp submit工作asyncronous
		 */
		function submit(){
			$.getJSON(me.url+'/submitJob?'+ paramStringURL + 'env:outSR=4326&f=json&callback=?', function(results){
						if(!results.error){
							var jobid=results.jobId;
							
							//setinteval to listen the job until the job status=='esriJobSucceeded'
							var jobURL=me.url+ '/jobs/'+jobid;
							var listenJob=setInterval(function(){
								$.getJSON(jobURL+'?returnMessages=true&f=json&callback=?', function(jobResults){
									if(jobResults.jobStatus=='esriJobSucceeded'){
										clearInterval(listenJob);
										//顯示成功狀態
										$("#"+me.domID_msg).fadeOut(100).html("<b><font color='#ff0000'>"+jobResults.jobStatus+"</font></b>").fadeIn(100);
										
										var num=0,
											returnResults=[];								
										$.each(jobResults.results, function(key, value){
											$.getJSON(jobURL+'/'+value.paramUrl+'?returnType=data&outSR=4326&f=json&callback=?', function(data){
												//將回傳的result中的geometry轉換成govleray
												returnResults.push(makeAGGPResult(data))
												num++;
												
												//當outputs都讀完之後
												if(num==me.outputs.length){
													//回去的gpResults都是esri的obj
													me.executeCallback(returnResults);
												}
											});//end get json
										});//end for each
									}else{
										//不斷顯示執行狀態
										if(me.domID_msg != "" && me.domID_msg){
											$("#"+me.domID_msg).fadeOut(100).html("<b><font color='#ff0000'>"+jobResults.jobStatus+"</font></b>").fadeIn(100);
										}
										
										//假如執行最後失敗
										if (jobResults.jobStatus == 'esriJobFailed') {
											clearInterval(listenJob);
											me.executeCallback(null, {message:'esriJobFailed'});
										}
									}
								});//end getjson
							},1000);
						}else{
							me.executeCallback(null, results.error);
							console.log('[ERROR]makoci.layer.aggp: submit工作錯誤');
						}
			});
		}//end function submit
		
		
		/**
		 * 將aggp回傳的result geometry json轉換成google.maps的marker, polyline, polygon
		 * @param {Object} results
		 */
		function makeAGGPResult(aggpResult){
			if(aggpResult.dataType=='GPFeatureRecordSetLayer'){
				var geometryType=aggpResult.value.geometryType;
				var features=aggpResult.value.features;
				
				$.each(features, function(j, feature){
					aggpResult.value.features[j].geometry=makoci.util.converter.agsGeometryJsonToGOverlays(geometryType, feature.geometry);
				});
			}
			return aggpResult;
		}
}



/**
 * 取得festureset的attribute
 * @param {FeatureSet} fset ArcGIS的FeatureSet
 */
makoci.layer.AGGP.prototype.getFSetAttribute = function(fset) {
		var html = '';
	
		if(fset.features.length > 0) {
			html = "<table>";
	
			//抓取所有欄位名稱
			html += "<tr>";
			for(var key in fset.features[0].attributes) {
				html += "<td bgcolor=#eeeeee>" + key + "</td>";
			}
			html += "</tr>";
	
			//給予欄位的值
			for(var i = 0; i < fset.features.length; i++) {
				html += "<tr onmouseover='this.bgColor=\"" + this.tr_mouseoverColor + "\";' onmouseout='this.bgColor=\"\";'>"
				for(var key in fset.features[i].attributes) {
					html += "<td>" + fset.features[i].attributes[key] + "</td>";
				}
				html += "</tr>"
			}
	
			html += '</table>';
		} else {
			html = '沒有任何資料，請重新查詢';
		}
	
		//將html儲存至_AGGPObject中，方便後續存取
		//_AGGPObject.outputs[i].attributeHtml=html;
	
		return html;
}


/**
 * 清除所有markers
 */
makoci.layer.AGGP.prototype.clearMarkerMangers = function() {
		makoci.layer.markerManager.clearMarkers();
}
	

/**
 * 將使用者繪製的feature塞入makoci.layer.AGGP_inputGOverlay全域矩陣當中
 * @class
 * @param {Object} geometry
 */
makoci.layer.AGGP.getGMapGeometry=function(geometry) {	
	//存入全域變數當中
	makoci.layer.AGGP_inputGOverlay[geometry.name] = geometry.agsFeatureSet;
}

