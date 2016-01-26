// Global Variables for county names and program type names
var countyNames = ['Alameda', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte', 'El Dorado', 'Fresno', 'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino', 'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Sierra', 'Santa Cruz', 'Siskiyou', 'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare', 'Tuolumne', 'Ventura', 'Yolo']

var typeNames = ['First Offender', '18 Month', 'Wet Reckless']


// Placeholder for selected county and selected type
var selectedCounty = ''
var selectedType = ''

var FTlayer

// Add names to dropdown lists
for (var i in countyNames) {
    $('#countyDropdown').append('<li><a href="#">' + countyNames[i] + '</a></li>')
}

for (var i in typeNames) {
    $('#typeDropdown').append('<li><a href="#">' + typeNames[i] + '</a></li>')
}



// Extracted program details from Excel file when interacting with Dropdown lists
$('#countyDropdown li').on('click', function () {
    selectedCounty = $(this).text();

    var countyIndex = countyNames.indexOf(selectedCounty);
    var typeIndex = typeNames.indexOf(selectedType);

    if (countyIndex !== -1 && typeIndex !== -1) {
        getExcelValue(countyIndex, typeIndex, function (arr) {
            console.log(arr);
            addRateChart(arr);
        });
        
        
        if (FTlayer){
        FTlayer.setMap(null);
        }
        
        //Add county bounrday to map
        FTlayer = new google.maps.FusionTablesLayer({
            query: {
                select: "col0",
                from: "1MrOQ5WXo-jcVGwfJahX62tFynizSeKwSfdmSyZVQ",
                where: "Name = '" + selectedCounty+ "'"
            },
            styles: [{
                polygonOptions: {
                    fillColor: '#00FF00',
                    fillOpacity: 0.1
                }
            }]
        });
        FTlayer.setMap(app.gmap);
                
        //Query CA_County Fusion Table and fitToBounds to the Polygon     
        county_sql = "SELECT * FROM " + app.tableID.CA_county + " WHERE Name = '"+selectedCounty+"'"
        console.log(county_sql);
        run.query(county_sql, function (json) {
            console.log('sql results:', json);
            
            pointArray = json['rows'][0][0]['geometry']['coordinates'][0]
            console.log(pointArray);
            
            var latlngbounds = new google.maps.LatLngBounds();
			for (var i = 0; i < pointArray.length; i++) {
				
                latlng = new google.maps.LatLng(pointArray[i][1], pointArray[i][0])
                
                latlngbounds.extend(latlng);
			}
			app.gmap.fitBounds(latlngbounds);
        });
        
    } else {
        console.log("something is wrong");
        console.log("countyIndex:", countyIndex);
        console.log("typeIndex:", typeIndex);
    }

    $('#countyBox').html($(this).text() + ' <span class="caret"></span>');
    $('#countyBox').val($(this).text());
});


$('#typeDropdown li').on('click', function () {
    selectedType = $(this).text();

    var countyIndex = countyNames.indexOf(selectedCounty);
    var typeIndex = typeNames.indexOf(selectedType);

    if (countyIndex !== -1 && typeIndex !== -1) {
        getExcelValue(countyIndex, typeIndex, function (arr) {
            console.log(arr);
            addRateChart(arr);
        });
        
        
        if (FTlayer){
        FTlayer.setMap(null);
        }
        
        //Add county bounrday to map
        FTlayer = new google.maps.FusionTablesLayer({
            query: {
                select: "col0",
                from: "1MrOQ5WXo-jcVGwfJahX62tFynizSeKwSfdmSyZVQ",
                where: "Name = '" + selectedCounty+ "'"
            },
            styles: [{
                polygonOptions: {
                    fillColor: '#00FF00',
                    fillOpacity: 0.1
                }
            }]
        });
        FTlayer.setMap(app.gmap);
                
        //Query CA_County Fusion Table and         
        county_sql = "SELECT * FROM " + app.tableID.CA_county + " WHERE Name = '"+selectedCounty+"'"
        console.log(county_sql);
        run.query(county_sql, function (json) {
            console.log('sql results:', json);
            
            app.gmap.panTo({lat: json['rows'][0][1]['geometry']['coordinates'][1], lng: json['rows'][0][1]['geometry']['coordinates'][0]});
            app.gmap.setZoom(9)
        });    
        
    } else {
        console.log("something is wrong");
        console.log("countyIndex:", countyIndex);
        console.log("typeIndex:", typeIndex);
    }

    $('#typeBox').html($(this).text() + ' <span class="caret"></span>');
    $('#typeBox').val($(this).text());
});




// Add an line chart with the input Array from Excel
function addRateChart(inputArr) {

    $('#rateChart').empty();

    new Morris.Line({
        element: 'rateChart',
        data: inputArr,
        smooth: false,
        xkey: 'y',
        xLabels: 'year',
        ykeys: ['C', 'T', 'X'],
        labels: ['Completion (State AVG: )', 'Termination (State AVG: )', 'Transfer (State AVG: )'],
        lineColors: ['#3371FF', '#FF5733', '#009933'],
        xLabelAngle: 70,
        yLabelFormat: function (y) {
            return (y * 100).toFixed(2) + ' %';
        },
        hideHover: 'auto'
    });
}