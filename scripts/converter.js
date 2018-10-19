// this script will convert svg to base 64 and put theme in a single json file
const fetch = require('node-fetch');
const path = `${process.cwd()}/assets/currency-flags/`;
const fs = require('fs');
const files = fs.readdirSync(path);
const BUILDPATH = `${process.cwd()}/build/`;
const buildFileName = 'currency-flags.json';
const DATA = {}

if (!fs.existsSync(BUILDPATH)){
    fs.mkdirSync(BUILDPATH);
}
// https://github.com/jprichardson/node-jsonfile
function stringify (obj, options) {
    let spaces
    let EOL = '\n'
    if (typeof options === 'object' && options !== null) {
      if (options.spaces) {
        spaces = options.spaces
      }
      if (options.EOL) {
        EOL = options.EOL
      }
    }
  
    const str = JSON.stringify(obj, options ? options.replacer : null, spaces)
  
    return str.replace(/\n/g, EOL) + EOL
}

// function to encode file data to base64 encoded string
const base64_encode = (file) => {
    // read binary data
    var bitmap = fs.readFileSync(`${path}${file}`);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// get currency data
const getCurrencyByLocalCode = async (code) => {
    try {
        let currency = "";
        const response = await fetch(`https://restcountries.eu/rest/v2/alpha/${code}`); // https://github.com/apilayer/restcountries
        const json = await response.json();
        if(json && json.currencies && json.currencies.length > 0){
            currency = json.currencies[0].code;
        }
        return currency;
    }
    catch(error) {
        console.error(error);
    }
}

const getCountriesByLocalCurrency = async (currency) => {
    try {
        let countires = [];
        const response = await fetch(`https://restcountries.eu/rest/v2/currency/${currency}`); // https://github.com/apilayer/restcountries
        const json = await response.json();
        if(json && json.length > 0){
            countires = json.map((country) => ({
                name: country.name,
                alpha2Code: country.alpha2Code,
                alpha3Code: country.alpha3Code,
            }));
        }
        return countires;
    }
    catch(error) {
        console.error(error);
    }
}

const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
}

const execute = async () => {
    console.log(`Fetching DATA ============`);
    await asyncForEach(files, async (file) => {
        const fileName = file.replace(/\.[^/.]+$/, "");
        if(fileName === "") return false;
        console.log(`Fetch entry: ${file}`);
        const code = fileName.toUpperCase();
        const countries = await getCountriesByLocalCurrency(code).then(c => c);
        DATA[code] = {
            code,
            countries,
            dataURI:`data:image/svg;${base64_encode(file)}`
        };
    });
    console.log(`Saving data to ${buildFileName}`);
    fs.writeFileSync(`${BUILDPATH}${buildFileName}`, stringify(DATA,{ spaces: 2, EOL: '\r\n' }));
    console.log(`Done  ============`);  
}

execute();
