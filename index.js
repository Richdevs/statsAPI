/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json());
const WebSocket = require('ws');
const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');


app.set('view engine', 'ejs');
app.use(express.static('public'));

const app_id = 1089; // Replace with your app_id or leave as 1089 for testing.
const connection = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
const api = new DerivAPIBasic({connection});


let ticksQuote = [];
let stats = {};
let requestId = {};
let tickRequest = generateTickRequest();

function generateTickRequest(symbol = 'R_100', count = 100) {

  return {
    ticks_history: symbol,
    count: count,
    adjust_start_time: 1,
    start: 1,
    end: 'latest',
    style: 'ticks',
    subscribe: 1
  };
}


const ticksResponse = async (res) => {

  const data = JSON.parse(res.data);
  // if (data.error !== undefined) {
  //     console.log('Error : ', data.error.message);
  //     connection.removeEventListener('message', ticksResponse, false);
  //     await api.disconnect();
  // }
  if (data.msg_type === 'history') {
    ticksQuote = data.history.prices.map((price) => price.toFixed(data.pip_size));


  }

  if (data.msg_type === 'tick') {
    const lastDigitCounts = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0
    };
    requestId = data.tick.id;
    const tick = Number(data.tick.quote).toFixed(data.tick.pip_size);
    ticksQuote.push(tick);
    if (ticksQuote.length > tickRequest.count) {
      ticksQuote.shift();
    }

    const lastDigits = ticksQuote.map((price) => {
      const digit = (price % 1).toFixed(data.tick.pip_size);
      const decDigit = digit.toString();
      return (decDigit.substring(decDigit.indexOf('.') + 1) % 10);
    });

    for (const digit of lastDigits) {
      if (lastDigitCounts[digit]) {
        lastDigitCounts[digit] += 1;
      } else {
        lastDigitCounts[digit] = 1;
      }
    }
    // LAST DIGIT STATS
    const digitStats = {};
    let evenP = 0;
    let oddP = 0;
    for (const digit in lastDigitCounts) {
      const dpercent = ((lastDigitCounts[digit] / lastDigits.length) * 100);
      digitStats[digit] = dpercent;

      if (parseInt(digit) % 2 === 0) {
        evenP += dpercent;
      } else {
        oddP += dpercent;
      }


    }
    // LAST TICKS TOTAL COUNT
    let totalEven = 0;
    let totalOdd = 0;
    for (const key in lastDigitCounts) {


      if (key % 2 === 0) {
        totalEven += lastDigitCounts[key];
      } else {
        totalOdd += lastDigitCounts[key];
      }
    }
    stats = {
      even: evenP,
      odd: oddP,
      evenTicks: totalEven,
      oddTicks: totalOdd,
      latestTick: tick
    };
    console.log(stats);
    return stats;
    
  }


 // connection.removeEventListener('message', ticksResponse, false);
};

const getTickStream = async () => {
  const {ticks_history, count} = tickRequest;


  const request = generateTickRequest(ticks_history, count);
  await api.subscribe(request);
  connection.addEventListener('message', ticksResponse);


  // next();
};
app.post('/ticks', async (req, res) => {

  const symbol = req.body.symbol;
  const newCount = req.body.count;

  tickRequest = generateTickRequest(symbol, newCount);

  try {
    await api.forget(requestId);
    tickRequest = generateTickRequest(symbol, newCount);
  } catch (error) {
    res.send(error);
  }
  await getTickStream();

  res.json('unsubscribed');
});
app.get('/ticks', async (req, res) => {
  getTickStream();
  res.send(stats);
});


app.listen(3000, () => {
  console.log('App Listens on Port 3000');
});

