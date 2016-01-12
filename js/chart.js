var countyNames = ['Alameda','Amador','Butte','Calaveras','Colusa','Contra Costa','Del Norte','El Dorado','Fresno','Humboldt','Imperial','Inyo','Kern','Kings','Lake','Lassen','Los Angeles','Madera','Marin','Mariposa','Mendocino','Merced','Modoc','Mono','Monterey','Napa','Nevada','Orange','Placer','Plumas','Riverside','Sacramento','San Benito','San Bernardino','San Diego','San Francisco','San Joaquin','San Luis Obispo','San Mateo','Santa Barbara','Santa Clara','Santa Cruz','Sierra','Santa Cruz','Siskiyou','Solano','Sonoma','Stanislaus','Sutter','Tehama','Trinity','Tulare','Tuolumne','Ventura','Yolo']

var typeNames = ['First Offender','18 Month','Wet Reckless']

var selectedCounty = ''
var selectedType = ''



for (var i in countyNames) {
  $('#countyDropdown').append('<li><a href="#">' + countyNames[i] +  '</a></li>')
}

for (var i in typeNames) {
  $('#typeDropdown').append('<li><a href="#">' + typeNames[i] +  '</a></li>')
}


$('#countyDropdown li').on('click', function(){
    selectedCounty = $(this).text();

    var countyIndex = countyNames.indexOf(selectedCounty);
    var typeIndex = typeNames.indexOf(selectedType);

    if(countyIndex && typeIndex){
      getExcelValue(countyIndex, typeIndex, function (arr){
          console.log(arr);
          addRateChart(arr);
      });
    }else{

    }

    $('#countyBox').html($(this).text() + ' <span class="caret"></span>');
    $('#countyBox').val($(this).text());
});


$('#typeDropdown li').on('click', function(){
    selectedType = $(this).text();

    var countyIndex = countyNames.indexOf(selectedCounty);
    var typeIndex = typeNames.indexOf(selectedType);

    if(countyIndex && typeIndex){
      getExcelValue(countyIndex, typeIndex, function (arr){
          console.log(arr);
          addRateChart(arr);
      });
    }else{

    }

    $('#typeBox').html($(this).text() + ' <span class="caret"></span>');
    $('#typeBox').val($(this).text());
});



function addRateChart(inputArr) {

    $('#rateChart').empty();

    new Morris.Line({
        element: 'rateChart',
        data:inputArr,
        smooth:false,
        xkey: 'y',
        xLabels:'year',
        ykeys: ['C','T','X'],
        labels: ['C_Rate','T_Rate','X_Rate'],
        lineColors : ['#3371FF','#FF5733','#009933'],
        xLabelAngle: 70,
        yLabelFormat: function(y){return (y *100).toFixed(2) + ' %'; },
        hideHover: 'auto'
    });
}
