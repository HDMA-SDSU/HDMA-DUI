//global variables for county names and program type names
var countyNames = ['California State', 'Alameda', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte', 'El Dorado', 'Fresno', 'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino', 'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Sierra', 'Siskiyou', 'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare', 'Tuolumne', 'Ventura', 'Yolo']

var typeNames = ['First Offender', '18 Month', 'Wet Reckless'];

//array for State Data
var data_State = []
    //for (i = 0; i < 3; i++) {
    //    getExcelValue(0, i, function(){}, function (arr) {
    //        data_State.push(arr);
    //    });
    //};


//placeholder for selected county and selected type
var selectedCounty = '';
var selectedType = 'First Offender';
var selectedState = false;
var countyIndex = -1;
var typeIndex = -1;

//place holder for 
var FTlayer

$(function () {
    for (var i in countyNames) {
        if (i == 0) {
            $('#countyDropdown').append('<li><a href="#">' + countyNames[i] + '</a></li>')
            $('#countyDropdown').append('<li role="separator" class="divider"></li>')
        } else {
            $('#countyDropdown').append('<li><a href="#">' + countyNames[i] + '</a></li>')
        }
    }

    for (var i in typeNames) {
        $('#typeDropdown').append('<li><a href="#">' + typeNames[i] + '</a></li>')
    }

    setupStateData();

    //extracted program details from excel file when interacting with Dropdown lists
    $('#countyDropdown li').on('click', function () {
        selectedCounty = $(this).text();

        console.log("selectedCounty, selectedType", selectedCounty, selectedType)

        chart.addCountyMap(selectedCounty, selectedType);

        $('#countyBox').html($(this).text() + ' <span class="caret"></span>');
        $('#countyBox').val($(this).text());
    });


    $('#typeDropdown li').on('click', function () {
        selectedType = $(this).text();

        chart.addCountyMap(selectedCounty, selectedType);

        $('#typeBox').html($(this).text() + ' <span class="caret"></span>');
        $('#typeBox').val($(this).text());
    });


    $('#popup_myRates').on('shown.bs.modal', function () { //listen for user to open modal
        $(chart.addModalChart)
    });
})


//add names to dropdown lists
//for (var i in countyNames) {
//    if (i == 0){
//        $('#countyDropdown').append('<li><a href="#">' + countyNames[i] + '</a></li>')
//        $('#countyDropdown').append('<li role="separator" class="divider"></li>')
//    }else{
//        $('#countyDropdown').append('<li><a href="#">' + countyNames[i] + '</a></li>')
//    }
//}
//
//for (var i in typeNames) {
//    $('#typeDropdown').append('<li><a href="#">' + typeNames[i] + '</a></li>')
//}






var chart = {
    //query and add county boundary to map view
    addCountyMap: function (selectedCounty, selectedType) {

        countyIndex = countyNames.indexOf(selectedCounty);
        typeIndex = typeNames.indexOf(selectedType);

        console.log("countyIndex, typeIndex: ", countyIndex, typeIndex)
            //console.log(selectedCounty,countyIndex)

        if (countyIndex !== -1 && typeIndex !== -1) {
            getExcelValue(countyIndex, typeIndex, function () {}, function (arr) {
                //console.log(arr);
                chart.addRateChart(arr);
            });

            //clear current county layer
            if (FTlayer) {
                FTlayer.setMap(null);
            }

            //setup where clause for Fusion Table Query
            var queryString = ""
            if (countyIndex > 0) {
                queryString = "Name = '" + selectedCounty + "'"
                selectedState = false;
            } else {
                selectedState = true;
            }

            //add county bounrday to map
            FTlayer = new google.maps.FusionTablesLayer({
                query: {
                    select: "col0",
                    from: "1MrOQ5WXo-jcVGwfJahX62tFynizSeKwSfdmSyZVQ",
                    //where: "Name = '" + selectedCounty + "'"
                    where: queryString
                },
                styles: [{
                    polygonOptions: {
                        fillColor: 'grey',
                        //fillColor: '#00FF00',
                        fillOpacity: 0.04
                    }
                }]
            });

            FTlayer.setMap(app.gmap);

            if (countyIndex > 0) {
                //query CA_County Fusion Table and fitToBounds to the Polygon     
                county_sql = "SELECT * FROM " + app.tableID.CA_county + " WHERE Name = '" + selectedCounty + "'"
                    //console.log(county_sql);
                run.query(county_sql, function (json) {

                    var pointArray = [];

                    //console.log('sql results:', json);
                    //console.log(json['rows'][0][0].hasOwnProperty('geometries'));

                    if (json['rows'][0][0].hasOwnProperty('geometries')) {
                        for (var i = 0; i < json['rows'][0][0]['geometries'].length; i++) {
                            //console.log(json['rows'][0][0]['geometries'][i]['coordinates'][0]);
                            for (var j = 0; j < json['rows'][0][0]['geometries'][i]['coordinates'][0].length; j++) {
                                pointArray.push(json['rows'][0][0]['geometries'][i]['coordinates'][0][j])
                            }
                        }
                    } else {
                        pointArray = json['rows'][0][0]['geometry']['coordinates'][0]
                    }

                    //console.log(pointArray);
                    var latlngbounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < pointArray.length; i++) {

                        latlng = new google.maps.LatLng(pointArray[i][1], pointArray[i][0])
                        latlngbounds.extend(latlng);
                    }
                    app.gmap.fitBounds(latlngbounds);
                });
            } else {
                app.gmap.fitBounds(app.initMapBounds);
            }
        }
    },


    //generate morris chart with input Array
    addRateChart: function (arr) {

        $('#rateChart').empty();

        new Morris.Line({
            element: 'rateChart',
            data: arr,
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
            hideHover: 'auto',
            //add custom Hover !!
            hoverCallback: function (index, options, content) {

                var data_CA = data_State[typeIndex][index];
                var data = options.data[index];

                if (selectedState == true) {
                    content = "<div class='morris-hover-row-label'>" + data.y + "</div><div class='morris-hover-point' style='color: #3371FF'>Completion: " + chart.numToRatio(data.C) + "</div><div class='morris-hover-point' style='color: #FF5733'> Termination: " + chart.numToRatio(data.T) + "</div><div class='morris-hover-point' style='color: #009933'>Transfer: " + chart.numToRatio(data.X) + "</div>";
                    return (content);

                } else {
                    content = "<div class='morris-hover-row-label'>" + data.y + "</div><div class='morris-hover-point' style='color: #3371FF'>Completion: " + chart.numToRatio(data.C) + " &nbsp;&nbsp;&nbsp;(State AVG: " + chart.numToRatio(data_CA.C) + ")</div><div class='morris-hover-point' style='color: #FF5733'> Termination: " + chart.numToRatio(data.T) + "&nbsp;&nbsp;&nbsp;(State AVG: " + chart.numToRatio(data_CA.T) + ")</div><div class='morris-hover-point' style='color: #009933'>Transfer: " + chart.numToRatio(data.X) + "   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(State AVG: " + chart.numToRatio(data_CA.X) + ")</div>";

                    return (content);
                }
            }
        });
    },

    //numner to fixed 2 decimal points
    numToRatio: function (number) {
        return (parseFloat(number) * 100).toFixed(2) + ' %';
    },

    //add init chart
    initChart: function (arr) {

        $('#rateChart').empty();

        new Morris.Line({
            element: 'rateChart',
            data: arr,
            smooth: false,
            xkey: 'y',
            xLabels: 'year',
            ykeys: ['C', 'T', 'X'],
            labels: ['Completion Rate', 'Termination Rate', 'Transfer Rate'],
            lineColors: ['#3371FF', '#FF5733', '#009933'],
            xLabelAngle: 70,
            yLabelFormat: function (y) {
                return (y * 100).toFixed(2) + ' %';
            },
            hideHover: 'auto',
            resize: true
        })
    },


    addModalChart: function () {

        var modalChartData = [
            {
                y: 'Completion',
                SDSU: 0.7812,
                State: 0.5640
            },
            {
                y: 'Termination',
                SDSU: 0.1985,
                State: 0.3827
            },
            {
                y: 'Transfer',
                SDSU: 0.0455,
                State: 0.0203
            }
        ]

        $('#myRateChart').empty();

        new Morris.Bar({
            element: 'myRateChart',
            data: modalChartData,
            smooth: false,
            xkey: 'y',
            ykeys: ['SDSU', 'State'],
            labels: ['SDSU DUIP', 'State AVG'],
            barColors: ['#3371FF', '#FF5733'],
            yLabelFormat: function (y) {
                return (y * 100).toFixed(2) + ' %';
            },
            xLabelFormat: function (y) {
                console.log(y.label)
                return (y.label + " Rate");
            },
            hideHover: 'auto',
            resize: true
        })
    }
}


// Init program
function setupStateData() {

    var tempArr = [];
    var promises = [];

    for (var i = 0; i < 3; i++) {
        var p1 = new Promise(function (resolve, reject) {
            getExcelValue(0, i, resolve, function (data) {});
            return p1
        })
        p1.then(function (results) {
            tempArr.push(results);
        })
        promises.push(p1);
    };

    Promise.all(promises).then(function () {
        data_State = tempArr;
        chart.initChart(tempArr[0]);
    })
}