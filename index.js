const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// support parsing of application/json type post data
app.use(bodyParser.json());

// support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'))


app.post('/data', function(req, res, next) {

  bot.answer(req.body);
  res.writeHead('200', {'Content-Type': 'application/json'})
  res.end('{ "text": "hello" }')

})

app.get('/data', function (req, res, next) {
  res.writeHead('200', {'Content-Type': 'application/json'})
  res.end('{ "text": "hello" }')
})

app.listen(3000)
