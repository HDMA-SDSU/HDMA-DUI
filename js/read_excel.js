var dataSheetNames = ['FO_C','FO_T','FO_X','18_Months_C','18_Months_T','18_Months_X','Wet_reckless_C','Wet_reckless_T','Wet_reckless_X']
var yearStart = 1995
var yearEnd = 2014

function getExcelValue(countyIndex, typeIndex, resolve, callback) {
    
    var resultsArr = [];
    var C_Rate_Arr = [];
    var T_Rate_Arr = [];
    var X_Rate_Arr = [];
    
    var url = "db/dui_rate_data_withState.xlsx";
    var oReq = new XMLHttpRequest();
    
    oReq.open("GET", url, true);
    oReq.responseType = "arraybuffer";

    oReq.onload = function (e) {
        var arraybuffer = oReq.response;

        /* convert data to binary string */
        var data = new Uint8Array(arraybuffer);
        var arr = new Array();
        for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
        var bstr = arr.join("");

        /* Call XLSX */
        var workbook = XLSX.read(bstr, {
            type: "binary"
        });
        
        var dataJson = to_json(workbook);
                
        var sheetCounterStart = parseInt(typeIndex) * 3
        var sheetCounterEnd = sheetCounterStart + 2
        
        for (i = sheetCounterStart; i< sheetCounterEnd + 1; i++ ){
            var sheetName = dataSheetNames[i];
            
            if (sheetName.slice(-1) == 'C'){
                var countyData = dataJson[sheetName][countyIndex]
                
                for (j = yearStart; j < yearEnd+1; j++){
                    
                    if (countyData[j] === 'null'){
                        C_Rate_Arr.push(null);
                    }
                    else{
                        C_Rate_Arr.push(parseFloat(countyData[j]))
                    }
                    
                }               
                //console.log(C_Rate_Arr)
            }
            else if (sheetName.slice(-1) == 'T'){
                var countyData = dataJson[sheetName][countyIndex]
                
                for (j = yearStart; j < yearEnd+1; j++){
                    
                    if (countyData[j] === 'null'){
                        T_Rate_Arr.push(null);
                    }
                    else{
                        T_Rate_Arr.push(parseFloat(countyData[j]))
                    }
                }
            }
            else if (sheetName.slice(-1) == 'X'){
                var countyData = dataJson[sheetName][countyIndex]
                
                for (j = yearStart; j < yearEnd+1; j++){
                    
                    if (countyData[j] === 'null'){
                        X_Rate_Arr.push(null);
                    }
                    else{
                        X_Rate_Arr.push(parseFloat(countyData[j]))
                    }
                }
            }
        }
        
        for ( i = (yearStart - 1995); i < (yearEnd - 1995 + 1); i++){
            var year = (i + 1995).toString();
            var C_rate = C_Rate_Arr[i];
            var T_rate = T_Rate_Arr[i];
            var X_rate = X_Rate_Arr[i];
            
            var inputJson = {};
            inputJson.y = year;
            inputJson.C = C_rate;
            inputJson.T = T_rate;
            inputJson.X = X_rate;
                
            resultsArr.push(inputJson)
        }
        
//        getCell(workbook, typeIndex, "T15" ,function(result){
//            resultsArr.push(result);
//        });
        resolve(resultsArr);
        callback(resultsArr);
        /* DO SOMETHING WITH workbook HERE */
    }
    oReq.send();
}

/* set up XMLHttpRequest */


var X = XLSX;

function to_json(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function (sheetName) {
        var roa = X.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        if (roa.length > 0) {
            result[sheetName] = roa;
        }
    });
    return result;
}


function getCell(workbook, typeIndex, address_of_cell, callback) {
    
    var address_of_cell = desired_cell;
    var sheetName = workbook.SheetNames[typeIndex];

    /* Get worksheet */
    var worksheet = workbook.Sheets[worksheet];

    /* Find desired cell */
    var desired_cell = worksheet[address_of_cell];

    /* Get the value */
    var desired_value = desired_cell.v;

    callback(desired_value);
}