'use strict';

const program = require('commander');
const moment = require('moment');
const currency_converter = require("currency-converter")({ CLIENTKEY: "8911a8bd457e48c89ef04108ffd14b6d"});

const data = require('./data/snapshots.json');
const dateFormat = 'YYYY-MM-DD';

let holdings = {};
let latestPrices = {};

program
	.version('0.1.0')
	.option('-b, --begin [date]', 'Start date (YYYY-MM-DD)')
	.option('-e, --end [date]', 'End date(YYYY-MM-DD)')
	.option('-s, --strategy [name]', 'Strategy to use')
	.parse(process.argv);

let startDate = (program.begin) ? moment(program.begin, dateFormat) : moment('20140101', dateFormat);
let endDate = (program.end) ? moment(program.end, dateFormat) : moment();
let strategy = (program.strategy) ? require('./strategies/' + program.strategy) : require('./strategies/top50');

function convertToCAD(printPrefix, value){
	console.log("USD value to convert: $" + value)
    let convert = currency_converter.convert(value, "USD", "CAD");
    var printConverted = function () {
	    convert
	        .then(function (fulfilled) {
	            console.log(printPrefix + '$' + fulfilled.amount.toLocaleString() + ' CAD');
	        })
	        .catch(function (error) {
	            console.log(error.message);
	        });
	}
	printConverted();
}

function showResults(holdings){
	let spent = 0;
	let value = 0;
	let profit = 0;
	let growth = 0.0;

	Object.keys(holdings).forEach(coinName => {
		let coin = holdings[coinName];
		spent += coin.spent;
		value += coin.value;
	});

	profit = value - spent;
	growth = profit / spent * 100;

	console.log('');
	convertToCAD('Spent: ', spent);
	convertToCAD('Value: ', value);
	convertToCAD('Profit: ', profit);
	console.log('');
	console.log('Growth: ' + growth.toFixed(2) + '%');
}

data.forEach(week => {
	if (moment(week.date, dateFormat).isAfter(startDate) && moment(week.date, dateFormat).isBefore(endDate)) {
		console.log('');
		console.log('Week of ' + week.date);
		holdings = strategy(holdings, week.coins);
	}
});

showResults(holdings);