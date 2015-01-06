
var app={
	gmap:null,
	tableID:{
		provider:'1qBvlmKMt_9vx6A0nts95ZLbTQE6gtIO9NYyc6jKl',
		fee:'1BJaFjSBV247xqMbWpGQyAsE4qC6Px8HAH7JPXb2c'
	},
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
	run.query('select * from ' + app.tableID.provider, function(json){
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
					run.query('select * from ' + app.tableID.provider, function(json){
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
		var sql="select * from " + app.tableID.provider +" where ST_INTERSECTS(lat, CIRCLE(LATLNG("+lat+","+lng+"),"+options.radius+"))";
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
				mapEvent=google.maps.event,
				marker=null,
				obj=null,
				latlngBounds=new google.maps.LatLngBounds();
				
			//markers
			//json.markers=[]
			
			$.each(rows, function(i,values){
				obj=run.makeObj(columns, values)
				
				obj.serviceTypes=run.getServiceTypes(obj.all_programDescription)
				
				marker=new google.maps.Marker({
					position: {lat: obj.lat, lng: obj.lng},
					map:app.gmap,
					title:obj.program_name
				})
				marker.dui={
					values:obj
				}
				
				mapEvent.addListener(marker, 'click', function(e){
					var values=this.dui.values,
						serviceTypes=values.serviceTypes,
						contentHtml=this.dui.contentHtml;
					
					if(!contentHtml || contentHtml==''){
						contentHtml=run.makeContentHtml(values)
						if(contentHtml!=''){this.dui.contentHtml=contentHtml}
					}
					
					app.popup.setContent(contentHtml)
					app.popup.open(app.gmap, this);
					
					//get fee
					var fee=this.dui.fee;
					var that=this;
					if(!fee){
						run.getFee(values.lic_lic_cert_nbr, function(result){
							that.dui.fee=result;
							run.showFee(result, serviceTypes);
						})
					}else{
						run.showFee(fee, serviceTypes);
					}
				})
				
				//latlngbounds
				latlngBounds.extend(marker.getPosition())
				
				app.markers.push(marker)
				
				
				//show list
				
			})
			
			//automatically zoom to markers bound
			if(options.fitBounds){app.gmap.fitBounds(latlngBounds)}
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
					  ((obj.address_site!="")?("<span class='address_site'>"+obj.address_site+"</span>"):"")+
					  ((obj.address_mail!="")?("<span class='address_mail'>Mail: "+obj.address_mail+"</span>"):"")+
					  ((obj.contact_phone!="")?("<span class='contact_phone'>Phone: <a href='tel:"+obj.contact_phone+"'>"+obj.contact_phone+"</a></span>"):"")+
					  ((obj.contact_fax!="")?("<span class='contact_fax'>Fax: <a href='tel:"+obj.contact_fax+"'>"+obj.contact_fax+"</a></span>"):"")+
					  ((obj.contact_tfree!="")?("<span class='contact_tfree'>Toll Free: <a href='tel:"+obj.contact_tfree+"'>"+obj.contact_tfree+"</a></span>"):"")+
					  "<p class='fee'><img src='images/loading.gif' /></p>"
					  /**
					  "<ul><li class='contactContent'>"+
					  	((obj.contact_phone!="")?("<span class='contact_phone'>Phone: "+obj.contact_phone+"</span>"):"")+
					  	((obj.contact_fax!="")?("<span class='contact_fax'>Fax: "+obj.contact_fax+"</span>"):"")+
					  	((obj.contact_tfree!="")?("<span class='contact_tfree'>Toll Free: "+obj.contact_tfree+"</span>"):"")+
					  "</li><li class='feeContent'>"+
					  	"<p class='fee'><img src='images/loading.gif' /></p>"+
					  "</li></ul>"+
					  */
					  
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
	getFee: function(lic_nbr, callback){
		if(!lic_nbr){console.log("[ERROR] run.getFee: no license nbr or service type"); return;}
		
		var sql='select * from ' + app.tableID.fee + ' where lic_cert_nbr=' + lic_nbr;
				
		//load all dui data
		run.query(sql, function(json){
			var result=null;
			
			if(json&&json.columns&&json.columns.length>0&&json.rows&&json.rows.length>0){
				result={}
				var columns=json.columns;
				
				$.each(json.rows, function(i,r){
					//result.push(run.makeObj(columns, r))
					result[r[6]]=r[9] //please note the index need to match the sequence of google sheets
				})
			}
			
			
			
			if(callback){
				callback(result)
			}
			
		});
		
	},
	
	
	
	//add comma
	addComma: function(val){
		while (/(\d+)(\d{3})/.test(val.toString())){
			val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
		}
		return val;
	}
	
}
