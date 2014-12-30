
var app={
	gmap:null,
	tableID:'1qBvlmKMt_9vx6A0nts95ZLbTQE6gtIO9NYyc6jKl',
	popup:new google.maps.InfoWindow(),
	markers:[],
	geocoder:new google.maps.Geocoder()
	
	
}




$(function(){
	//init ui
	init.ui()
	
	//init map
	init.map("gmap")
	
	//load all dui data
	run.query('select * from ' + app.tableID, function(json){
		run.showResult(json);
	});
})



//init
var init={
	ui: function(){
		
		
		//input 
		$("#mapHeader input[type='text']").keyup(function(e){
			if(e.keyCode==13){
				//geocoding 
				var value=$(this).val()
				
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
					run.query('select * from ' + app.tableID, function(json){
						run.showResult(json);
					});
				}
			}
		})
		
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
		options.radius=options.radius || 50000;
		
		//query
		var sql="select * from " + app.tableID +" where ST_INTERSECTS(lat, CIRCLE(LATLNG("+lat+","+lng+"),"+options.radius+"))";
		run.query(sql, function(json){
			//clear all existing markers
			run.clearMarkers({emptyMarkers:true});
			
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
	},
	
	
	//show result
	showResult: function(json, options){
		//options
		if(!options){options={}}
		options.fitBounds=options.fitBounds || true;
	
		if(json&&json.rows&&json.columns&&json.rows.length>0){
			var columns=json.columns,
				rows=json.rows,
				makeObj=function(keys, values){var obj={}; $.each(keys, function(i,k){obj[k]=values[i]}); return obj}
				mapEvent=google.maps.event,
				marker=null,
				obj=null,
				latlngBounds=new google.maps.LatLngBounds();
				
			//markers
			//json.markers=[]
			
			$.each(rows, function(i,values){
				obj=makeObj(columns, values)
				
				marker=new google.maps.Marker({
					position: {lat: obj.lat, lng: obj.lng},
					map:app.gmap,
					title:obj.program_name
				})
				marker.dui={
					values:obj
				}
				
				mapEvent.addListener(marker, 'click', function(e){
					var values=this.dui.values;
					
					app.popup.setContent(values.program_name)
					app.popup.open(app.gmap, this);
				})
				
				//latlngbounds
				latlngBounds.extend(marker.getPosition())
				
				app.markers.push(marker)
			})
			
			//automatically zoom to markers bound
			if(options.fitBounds){app.gmap.fitBounds(latlngBounds)}
		}	
			
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
	}
	
}
