function checkAccount() {
    var checkWithPaymentsNZ = true;
    //eg. banknumber 01 - 0902 - 0068389 - 00
    //get value from the page
    var bankId = document.getElementById('bankId').value;
    var branchId = document.getElementById('branchId').value;
    var accountBaseId = document.getElementById('accountBaseId').value;
    var suffixId = document.getElementById('suffixId').value;
    
    getJSON('output.json',function(err, data) {
        if (err !== null) {
            alert('Something went wrong: ' + err);
        } else {
            var jsonObj = data;
            //if enabled check with payments nz for active/new branches
            if(checkWithPaymentsNZ) {
                var isBranchValid = checkIfBankBranchValid(jsonObj, bankId, branchId);
                //if branch is not valid return error
                if(!isBranchValid) {
                    console.log('branch is not valid');
                    return;
                }
            } 
            var results = validateBank( bankId, branchId, accountBaseId, suffixId);
            console.log(results);
        }
    });	
    
}

function validateBank(bankId, branchId, accountBaseId, suffixId) {
    var algoMap = new Map();
    //algorithm based on IRD file https://www.ird.govt.nz/resources/d/8/d8e49dce-1bda-4875-8acf-9ebf908c6e17/rwt-nrwt-spec-2014.pdf
    algoMap.set('A',new Array(0, 0, 6, 3, 7, 9, 0, 0, 10, 5, 8, 4, 2, 1, 0, 0, 0, 0, 11));
    algoMap.set('B',new Array(0, 0, 0, 0, 0, 0, 0, 0, 10, 5, 8, 4, 2, 1, 0, 0, 0, 0, 11));
    algoMap.set('C',new Array(3, 7, 0, 0, 0, 0, 9, 1, 10, 5, 3, 4, 2, 1, 0, 0, 0, 0, 11));
    algoMap.set('D',new Array(0, 0, 0, 0, 0, 0, 0, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 11));
    algoMap.set('E',new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 4, 3, 2, 0, 0, 0, 1, 11));
    algoMap.set('F',new Array(0, 0, 0, 0, 0, 0, 0, 1, 7, 3, 1, 7, 3, 1, 0, 0, 0, 0, 10));
    algoMap.set('G',new Array(0, 0, 0, 0, 0, 0, 0, 1, 3, 7, 1, 3, 7, 1, 0, 3, 7, 1, 10));
    algoMap.set('X',new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1));
    console.log(algoMap);

    var algoOutput = getAlgo(bankId, branchId, accountBaseId);
    console.log(algoOutput);
    if(algoOutput == false) {
        return false;
    } else {
        //format the number
        var formatOutput = formatAccountNumber(bankId, branchId, accountBaseId, suffixId);        
        console.log(formatOutput);
        var accountNumberOutput = formatOutput.bankId + formatOutput.branchId + formatOutput.accountBaseId + formatOutput.suffixId;
        console.log(accountNumberOutput);
        //calculate if account is valid
        var results = calculateCheckSum(algoMap, algoOutput, accountNumberOutput);
        if(results == 0) {
            return true; console.log('valid');
        } else { 
            return false; console.log('not valid ' + results);
        }
    }

}

//formats account number in the ird format
function formatAccountNumber(bankId, branchId, accountBaseId, suffixId) {
    var accountNumberObject = new Object();
    accountNumberObject.bankId = bankId.padStart(2,'0');
    accountNumberObject.branchId = branchId.padStart(4,'0');
    accountNumberObject.accountBaseId = accountBaseId.padStart(8,'0');
    accountNumberObject.suffixId = suffixId.padStart(4,'0');
    return accountNumberObject;
}

function calculateCheckSum(algoMap, algoOutput, accountNumberOutput) {
    var sum = 0;
    var multipliers = algoMap.get(algoOutput);
    //removes last value and assign to modulo
    var modulo = multipliers.pop(); 

    //loop through the multiplier
    for(var i = 0; i < multipliers.length; i++) {
        var product = accountNumberOutput[i] * multipliers[i];
        if(algoOutput == 'A') {
            sum += product;
        }
    }
    //console.log(sum);
    
    var remainder = sum % modulo;
    return remainder;
    
}
//get the algorithm to use for the bank number
function getAlgo(bankId, branchId, accountBaseId) {
    if (bankId == '01' && ((branchId >= 1 && branchId <= 999) || (branchId >= 1100 && branchId <= 1199) || (branchId >= 1800 && branchId <= 1899))) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '02' && ((branchId >= 1 && branchId <= 999) || (branchId >= 1200 && branchId <= 1299))) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '03' && ((branchId >= 1 && branchId <= 999) || (branchId >= 1300 && branchId <= 1399) || (branchId >= 1500 && branchId <= 1599) || (branchId >= 1700 && branchId <= 1799) || (branchId >= 1900 && branchId <= 1999))) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '06' && ((branchId >= 1 && branchId <= 999) || (branchId >= 1400 && branchId <= 1499))) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    /*  not in used */
    } else if (bankId == '08' && (branchId >= 6500 && branchId <= 6599)) {
        return 'D';
    /*  not in used */    
    } else if (bankId == '09' && branchId == '0000') {
        return 'E';
    } else if (bankId == '11' && ((branchId >= 5000 && branchId <= 6499) || (branchId >= 6600 && branchId <= 8999))) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '12' && ((branchId >= 3000 && branchId <= 3299) || (branchId >= 3400 && branchId <= 3499) || (branchId >= 3600 && branchId <= 3699))) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '13' && (branchId >= 4900 && branchId <= 4999)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '14' && (branchId >= 4700 && branchId <= 4799)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '15' && (branchId >= 3900 && branchId <= 3999)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '16' && (branchId >= 4400 && branchId <= 4499)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '17' && (branchId >= 3300 && branchId <= 3399)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '18' && (branchId >= 3500 && branchId <= 3599)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '19' && (branchId >= 4600 && branchId <= 4649)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '20' && (branchId >= 4100 && branchId <= 4199)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '21' && (branchId >= 4800 && branchId <= 4899)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '22' && (branchId >= 4000 && branchId <= 4049)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '23' && (branchId >= 3700 && branchId <= 3799)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '24' && (branchId >= 4300 && branchId <= 4349)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '25' && (branchId >= 2500 && branchId <= 2599)) {
        return 'F';
    } else if (bankId == '26' && (branchId >= 2600 && branchId <= 2699)) {
        return 'G';
    } else if (bankId == '27' && (branchId >= 3800 && branchId <= 3849)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '28' && (branchId >= 2100 && branchId <= 2149)) {
        return 'G';
    } else if (bankId == '29' && (branchId >= 2150 && branchId <= 2299)) {
        return 'G';
    } else if (bankId == '30' && (branchId >= 2900 && branchId <= 2949)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '31' && (branchId >= 2800 && branchId <= 2849)) {
        return 'X';
    } else if (bankId == '33' && (branchId >= 6700 && branchId <= 6799)) {
        return 'F';
    } else if (bankId == '35' && (branchId >= 2400 && branchId <= 2499)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else if (bankId == '38' && (branchId >= 9000 && branchId <= 9499)) {
        if (accountBaseId < 990000) {
            return 'A';
        } else {
            return 'B';
        }
    } else {
        return false;
    }

}
function checkIfBankBranchValid(jsonObj, bankId, branchId) {
    for(i in jsonObj) {

        if(bankId == jsonObj[i].Bank_Number && branchId == jsonObj[i].Branch_Number){
            return true;
            break;
        }
    }
    return false;
}

var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
    var status = xhr.status;
    console.log(status);
    console.log(xhr);

    if (status === 200) {
        callback(null, xhr.response);
    } else {
        callback(status, xhr.response);
    }
    };
    xhr.send();
};