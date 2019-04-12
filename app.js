var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var http = require('http');
var bdt1 = new (require("./bdt1.js"))();

app.get('/', (req,res,next)=>{bdt1.page(req,res,next)});

app.get('*', (req, res)=>{
  res.status(404).send("404\n");
});
app.post('*', (req, res)=>{
  res.status(404).send("404\n");
});
(async function() {
	try{
		http.createServer( app).listen(4242);
	}catch(e){
		console.error(e)
	}
})()