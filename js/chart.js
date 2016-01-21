// Global Variables for county names and program type names
var countyNames = ['Alameda', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte', 'El Dorado', 'Fresno', 'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino', 'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Sierra', 'Santa Cruz', 'Siskiyou', 'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare', 'Tuolumne', 'Ventura', 'Yolo']

var typeNames = ['First Offender', '18 Month', 'Wet Reckless']


// Placeholder for selected county and selected type
var selectedCounty = ''
var selectedType = ''



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
        
        // Map Pan to location
        app.gmap.panTo({lat: 33.0236041, lng: -116.7761174})
        
        
        //Query CA_County Fusion Table and 
        console.log("selectedCounty", selectedCounty);
        
        county_sql = "SELECT * FROM " + app.tableID.CA_county //+ "' WHERE Name = '"+selectedCounty+"'"
        console.log(county_sql);
        run.query(county_sql, function (json) {
            console.log('sql results:', json)
        })
        
        
        //Add county bounrday to map
        // NOT WORKING YET
        var layer = new google.maps.FusionTablesLayer({
            query: {
                select: "col0",
                from: "1MrOQ5WXo-jcVGwfJahX62tFynizSeKwSfdmSyZVQ"
            },
            styles: [{
                polygonOptions: {
                    fillColor: '#00FF00',
                    fillOpacity: 0.3
                }
            }]
        });
        layer.setMap(app.gmap);
        
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
        labels: ['Completion_Rate', 'Termination_Rate', 'Transfer_Rate'],
        lineColors: ['#3371FF', '#FF5733', '#009933'],
        xLabelAngle: 70,
        yLabelFormat: function (y) {
            return (y * 100).toFixed(2) + ' %';
        },
        hideHover: 'auto'
    });
}