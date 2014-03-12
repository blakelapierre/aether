var debugObject = function(o) {
	var d = '{';
	for (var key in o) {
		var value = o[key];
		if (typeof value === 'object') d += '\n' + key + ': ' + debugObject(value);
		else d += '\n' + key + ': ' + value;
	}
	d += '}';
	return d;
}



angular.module('aether', [])
	.controller('AetherCtrl', ['$scope', 'socket', function($scope, socket) {
		console.log('controller called');

		$scope.messages = [];
		$scope.incompleteMessages = {};
		$scope.currentMessageID = 0;

		socket.on('welcome', function(data) {
			$scope.messages.push(data);
		});

		socket.on('message', function(data) {
			var id = data.originName + data.messageID,
				existing = $scope.incompleteMessages[id];

			if (existing) {
				existing.message = data.message;
				if (data.complete) {
					existing.complete = true;
					delete $scope.incompleteMessages[id];
				}
			}
			else {
				$scope.messages.push(data);
				if (data.complete !== true) $scope.incompleteMessages[id] = data;
			}
		});

		$scope.sendMessage = function() {
			socket.emit('message', {id: $scope.currentMessageID, message: $scope.currentMessage, complete: true});
			$scope.currentMessage = '';
			$scope.currentMessageID++;
		};

		$scope.currentMessageChanged = function() {
			socket.emit('message', {id: $scope.currentMessageID, message: $scope.currentMessage, complete: false});
		};

		$scope.isMessageComplete = function(message) {
			return message.complete;
		};

		var name = prompt('Name please', 'I didn\'t change my name :(');
		socket.emit('name', name);
	}])
	.factory('socket', function($rootScope) {
		var socket = io.connect('http://' + window.location.host);
		return {
			on: function(eventName, callback) {
				socket.on(eventName, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						callback.apply(socket, args);
					});
				});
			},
			emit: function(eventName, data, callback) {
				socket.emit(eventName, data, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						if (callback) {
							callback.apply(socket, args);
						}
					});
				});
			}
		};
	})
	.factory('geolocationResource', ['$rootScope', function($rootScope) {
		return {
			getLocation: function(callback) {
				var location = {};
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function(position) {
						location.position = position;
						$rootScope.$apply(function() {
							if (callback) {
								callback.apply(location);
							}
						});
					});
				}
				return location;
			}
		};
	}]);