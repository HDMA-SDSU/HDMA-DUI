
var app={
	gmap:null,
	tableID:{
		provider:'1qBvlmKMt_9vx6A0nts95ZLbTQE6gtIO9NYyc6jKl',
		fee:'1BJaFjSBV247xqMbWpGQyAsE4qC6Px8HAH7JPXb2c',
		update:'1s4VLjbbYjCzu0Ys26HV3v_sHxdpW43aKZpnraxNG'
	},
	popup:new google.maps.InfoWindow(),
	markers:[],
	geocodingMarker:null,
	geocoder:new google.maps.Geocoder(),
	direction:new google.maps.DirectionsService(),
	directionRenderer:null
	
}




$(function(){
	
	$.getScript("js/markerwithlabel.js", function(){
		//init ui
		init.ui()
		
		//init map
		init.map("gmap")
		
		//load all dui data
		run.query('select * from ' + app.tableID.update, function(json){
			run.showResult(json);
		});
	});
})



//init
var init={
	ui: function(){
		var $header=$("#header");
		
		//input 
		$header.find("input[type='text']").keyup(function(e){
			if(e.keyCode==13){
				run.search();
			}
		})
		
		
		//search dropdown menu
		$header.find(".dropdown-menu > li > a").click(function(){
			var $this=$(this),
				value=$this.attr("data-value"),
				placeHolder=$this.attr('data-placeHolder'),
				text=$this.text();
			
			$header.find("input[type='text']").attr({"data-value": value, 'placeHolder': placeHolder});
			$header.find("#btn-search").text(text);
			
			run.search();
		});
		
		//search button
		$header.find("#btn-search").click(function(){
			run.search();
		});
		
		
	},
	
	
	map: function(domID){
		
			app.gmap=new google.maps.Map(document.getElementById(domID), {
				center:{lat: 34.397, lng: -121.344},
				zoom:8,
				streetViewControl:true,
				panControl:false,
				zoomControlOptions:{style:google.maps.ZoomControlStyle.SMALL, position: google.maps.ControlPosition.RIGHT_BOTTOM}
			});
		
		
	}
}


//run
var run={
	//search
	search: function(){
		//geocoding
		var $this=$("#header input[type='text']"), 
			value=$this.val(),
			type=$this.attr('data-value');
		
		//clear existing geocoding marker
		if(app.geocodingMarker){app.geocodingMarker.setMap(null); app.geocodingMarker=null;}
		if(app.directionRenderer){app.directionRenderer.setMap(null); }
		
		//show loading
		$("#header .loading").show();
			
		if(type&&type!=""){
			switch(type){
				case "address":
					if(value&&value!=''){
						run.geocoding(value, function(results, status){
							if(results&&results.length>0){
								//get first result
								var latlng=results[0].geometry.location;
								run.spatialQuery(latlng.lat(), latlng.lng())
							}
						})
					}else{
						//load all dui data
						run.query('select * from ' + app.tableID.update, function(json){
							run.showResult(json);
						});
					}
				break;
				case "name":
					if(value&&value!=""){
						run.query('select * from ' + app.tableID.update + " where program_name LIKE '%"+value+"%'", function(json){
							run.showResult(json)
						})
					}
				break;
			}
					
		}	
		
		
	},
	
	
	
	//load dui data
	query: function(sql, callback){
		var url='https://www.googleapis.com/fusiontables/v2/query?',
			params={
				sql: sql,
				key:'AIzaSyAqd6BFSfKhHPiGaNUXnSt6jAzQ9q_3DyU'
			};
			
		if(sql&&sql!=""){
			url=url+$.map(params, function(v,k){return k+"="+encodeURIComponent(v)}).join("&")
			//console.log(url)
			$.getJSON(url, function(json){
				var output=null;
				
				if(json.columns&&json.rows&&json.columns.length>0&&json.rows.length>0){
					output=json
				}
				
				if(callback){callback(output)}
			})
			
		}
		
	},
	
	
	//spatial query
	spatialQuery: function(lat, lng, options){
		if(!lat || lat=='' || !lng || lng==''){console.log('[ERROR] run.spatailQuery: no lat or lng'); return;}
		
		//options
		if(!options){options={}}
		options.radius=options.radius || 50000; //unit: meter
		
		//show geocoding marker
		app.geocodingMarker=new google.maps.Marker({
			position:{lat:lat, lng:lng},
			map:app.gmap,
			icon:{
				url:"images/1420695267_Social_Media_Socialmedia_network_share_socialnetwork_network-14-128.png",
				//size:new google.maps.Size(35,35),
				scaledSize: new google.maps.Size(35,35)
			},
			title: "Your Location: "+ $("#header input[type='text']").val()
		});
		
		
		//query
		//var sql="select * from " + app.tableID.update +" where ST_INTERSECTS(lat, CIRCLE(LATLNG("+lat+","+lng+"),"+options.radius+"))";
		var sql="select * from " + app.tableID.update +" order by ST_DISTANCE(lat, LATLNG("+lat+","+lng+")) limit 10";
		run.query(sql, function(json){
			run.showResult(json);
		})
			
	},
	
	
	//clear all existing markers
	clearMarkers:function(options){
		//options
		if(!options){options={}}
		options.emptyMarkers=options.emptyMarkers || false;
		
		if(app.markers.length>0){
			$.each(app.markers, function(i,m){
				m.setMap(null)
			}); 
			
			if(options.emptyMarkers){app.markers=[]}
		}
		
		//clear listContent
		$("#listContent > ul").html("")
	},
	
	
	//show result
	showResult: function(json, options){
		//options
		if(!options){options={}}
		options.fitBounds=options.fitBounds || true;
	
		if(json&&json.rows&&json.columns&&json.rows.length>0){
			var columns=json.columns,
				rows=json.rows,
				mapEvent=google.maps.event,
				marker=null,
				obj=null,
				$list=$("#listContent > ul"),
				latlngBounds=new google.maps.LatLngBounds();
			
			
			//clear all existing markers
			run.clearMarkers({emptyMarkers:true});
			

			//show Badge nad hide loading
			var $header=$("#header")
			$header.find(".badge").html(rows.length).show();
			$header.find(".alert, .loading").hide();
			
			//markers
			//json.markers=[]
			$.each(rows, function(i,values){
				obj=run.makeObj(columns, values)
				
				obj.serviceTypes=run.getServiceTypes(obj.all_programDescription)
				obj.fees=run.getFee(obj.all_Fee);
				
				//delete all fee
				delete obj.all_Fee
				
				//marker=new google.maps.Marker({
				marker=new MarkerWithLabel({
					position: {lat: obj.lat, lng: obj.lng},
					map:app.gmap,
					title:obj.program_name,
					draggable:false,
					icon:{
						url:"images/symbol_blank.png",
						scaledSize:new google.maps.Size(30,30),
					},
					labelContent:i+1,
					labelAnchor: new google.maps.Point(10,25),
					labelClass: "mapIconLabel",
					labelInBackground:false
				})
				marker.dui={
					values:obj,
					contentHtml:run.makeContentHtml(obj)
				}
				
		
				//click event
				mapEvent.addListener(marker, 'click', function(e){
					var values=this.dui.values,
						serviceTypes=values.serviceTypes,
						contentHtml=this.dui.contentHtml;
					
					app.popup.setContent(contentHtml)
					app.popup.open(app.gmap, this);
				})
				
				//latlngbounds
				latlngBounds.extend(marker.getPosition())
				
				app.markers.push(marker)
				
				
				//show list
				$list.append("<li data-id="+i+">"+marker.dui.contentHtml+"<span class='badge num'>"+(i+1)+"</span></li>");
				
			})
			
			//automatically zoom to markers bound
			if(options.fitBounds){app.gmap.fitBounds(latlngBounds)}
			
			//add a click event on each li in the contentList
			$list.find("> li").click(function(){
				var $this=$(this),
					id=$this.attr('data-id'),
					marker=app.markers[id];
				
				app.gmap.setZoom(12);
				app.gmap.panTo(marker.position);
				google.maps.event.trigger(marker,'click')
			})
		}else{
			//if no result
			//hide Badge
			$("#header .badge").html("").hide();
			$("#header .alert").show();
			
		}
			
	},
	
	
	//show fee
	showFee:function(result, serviceTypes){
		//var html="<table><tr><td>Service Type</td><td>Fee</td></tr>";
		var html=""//"<b>Fee</b>";
							

		$.each(result, function(k,v){
			//html+="<tr "+((serviceTypes.indexOf(k)!=-1)?"class='highlight'":"")+"><td>"+k+"</td><td>$"+v+"</td></tr>";
			if(serviceTypes.indexOf(k)!=-1){
				//html+="<tr><td>"+k+"</td><td>$"+v+"</td></tr>";
				html+="<span>"+k+": <b>$ "+run.addComma(v)+"</b></span>";
			}
		})
		//html+="</table>";
							
		$(".contentHtml .fee").html(html)
	},
	
	
	//geocoding
	geocoding: function(address, callback){
		if(address&&address!=""){
			app.geocoder.geocode({
				address:address
				//region:
			}, function(results, status){
				var output=null;
				
				if(status=='OK'&&results&&results.length>0){
					output=results;
				}
				
				
				if(callback){
					callback(results,status)
				}
			});
			
		}
	},
	
	
	//generate html for popup window and list
	makeContentHtml: function(obj){
		var html="";

		if(obj){
			//console.log(obj)
			html="<div class='contentHtml'>"+
					  "<p class='type'>DUI for "+ obj.serviceTypes.join(" / ") +"</p>"+
					  "<h3 class='title'>"+obj.program_name +"</h3>"+
					  ((app.geocodingMarker)?("<span class='distance'>"+run.getDistance(obj.lat, obj.lng)+"</span>"):"")+
					  ((obj.address_site!="")?("<span class='address_site'>"+obj.address_site+"</span>"):"")+
					  ((obj.address_mail!="")?("<span class='address_mail'>Mail: "+obj.address_mail+"</span>"):"")+
					  ((obj.contact_phone!="")?("<span class='contact_phone'>Phone: <a href='tel:"+obj.contact_phone+"'>"+obj.contact_phone+"</a></span>"):"")+
					  ((obj.contact_fax!="")?("<span class='contact_fax'>Fax: <a href='tel:"+obj.contact_fax+"'>"+obj.contact_fax+"</a></span>"):"")+
					  ((obj.contact_tfree!="")?("<span class='contact_tfree'>Toll Free: <a href='tel:"+obj.contact_tfree+"'>"+obj.contact_tfree+"</a></span>"):"")+
					  "<p class='fee'>"+
					    (function(){
					    	var result='';
					    	$.each(obj.serviceTypes, function(i,k){
					    		result+="<span>"+k+": <b>$ "+run.addComma(obj.fees[k])+"</b></span>";
					    	})
					    	return result;
					    })()+
					  "</p>"+
					  ((app.geocodingMarker)?("<div class='route'><a href='#' onclick='run.route("+obj.lat+", "+obj.lng+")'><img  src='images/1420698239_directions.png' title='get Direction' /></a></div>"):"")+
				  "</div>";
			
		}
		

		return html;
	},
	
	
	//get service type from string
	getServiceTypes: function(v){
		var types=[];
		$.each(v.split(" / "), function(i,k){
			if(types.indexOf(k)==-1){types.push(k)}
		})
		return types;
	},
	
	
	//make columns and rows as object
	makeObj: function(columns, rows){
		var obj={}; 
		$.each(columns, function(i,k){obj[k]=rows[i]}); 
		return obj
	},
	
	
	
	//get fee
	getFee: function(str_fee){
		if(!str_fee || str_fee==''){console.log('[ERROR] NO FEE: please check'); return;}
		
		var fees=str_fee.split(" / "),
			result={},
			temp;
		$.each(fees, function(i,f){
			temp=f.split(": ");
			
			result[temp[0]]=parseFloat(temp[1])
		})
		
		return result;
	},
	
	
	
	//add comma
	addComma: function(val){
		while (/(\d+)(\d{3})/.test(val.toString())){
			val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
		}
		return val;
	},
	
	
	
	//get eucliedean distance
	getDistance: function(lat1, lon1, options) {
		//options
		if(!options){options={}}
		options.unit=options.unit || 'mi';
		options.decimal=options.decimal || 1;
		
		var position=app.geocodingMarker.getPosition(),
			lat2=position.lat(),
			lon2=position.lng(),
			radlat1 = Math.PI * lat1/180,
			radlat2 = Math.PI * lat2/180,
			radlon1 = Math.PI * lon1/180,
			radlon2 = Math.PI * lon2/180,
			theta = lon1-lon2,
			radtheta = Math.PI * theta/180,
			dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
			
		dist = Math.acos(dist)
		dist = dist * 180/Math.PI
		dist = dist * 60 * 1.1515
		if (options.unit=="km") { dist = dist * 1.609344 }
		if (options.unit=="mi") { dist = dist * 0.8684 }
		return dist.toFixed(options.decimal) + " " + options.unit
	} ,
	
	
	//route
	route:function(lat,lng){
		if(!lat||!lng){console.log("[ERROR] run.route: no input lat or lng"); return;}
		if(!app.geocodingMarker){console.log("[ERROR] run.route: no app.geocodingMarker"); return; }
		
		//clear existing route
		if(app.directionRenderer){app.directionRenderer.setMap(null)}
		
		
		//start routing
		app.direction.route({
			origin: app.geocodingMarker.getPosition(),
			destination: new google.maps.LatLng(lat,lng),
			travelMode: google.maps.TravelMode.DRIVING,
			unitSystem: google.maps.UnitSystem.IMPERIAL
		}, function(result, status){
			if(status=='OK'){
				if(result.routes&&result.routes.length>0){
					
					app.directionRenderer=new google.maps.DirectionsRenderer({
						directions: result,
						map:app.gmap,
						suppressMarkers:true
					})
					
					
					/**
					var route=result.routes[0];
					app.route=new google.maps.Polyline({
						path:route.overview_path,
						map:app.gmap,
						strokeColor:"#CC1A48",
						strokeOpacity:0.7, 
						strokeWeight:5,
						directionResult:route
					})
					
					//app.gmap.fitBounds(route.bounds)
					
					google.maps.event.addListener(app.route, "click", function(){
						console.log(this)
					})
					*/
				}
			}
		});
	}
	
}
