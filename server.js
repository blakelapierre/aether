var express = require("express"),
	app = express(),
	port = 3000;
	
app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);

	
app.get('/', function(req, res) {
	res.render('page');
});

app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port));

io.set('log level', 0);

var sockets = [],
	nextClientID = 0,
	getNextClientID = function() {
		return nextClientID++;
	};
	
var newClient = function(socket) {
	var clientID = getNextClientID(),
		clientName = clientID,
		clientPosition = {latitude: null, longitude: null, accuracy: null};
		
	var client = {
		id: clientID,
		name: clientName,
		position: clientPosition,
		socket: socket
	};
	
	return client;
};

io.sockets.on('connection', function(socket) {
	console.log(socket.id);
	var client = newClient(socket);
	
	var removeSocket = function() {
		var index = sockets.indexOf(socket);
		if (index != -1) sockets.splice(index, 1);
	};
	
	socket.set('client', client, function() {
		socket.emit('ready');
	});
	
	socket.on('disconnect', removeSocket);
	
	socket.on('close', removeSocket);
	
	socket.on('name', function(name) {
		client.name = name;
		socket.get('client', function(err, client) {
			console.log(client.name + ' name set');
		});
	});
	
	socket.on('message', function(data) {
		console.log(client.name, ': ', data.message);
		io.sockets.emit('message', {
			originID: client.id,
			originName: client.name,
			messageID: data.id,
			message: data.message,
			complete: data.complete
		});
	});
	
	socket.on('position', function(data) {
		client.position = {
			latitude: data.position.coords.latitude,
			longitude: data.position.coords.longitude,
			accuracy: data.position.coords.accuracy
		};
		
		io.sockets.emit('client_position', { 
			clientID: client.id,
			clientName: client.name,
			position: client.position 
		});
	});
	
	socket.emit('welcome', { 
		clientID: client.id,
		message: 'welcome to the aether',
		complete: true
	});
	
	sockets.push(socket);
});

console.log('Listening on port ' + port);