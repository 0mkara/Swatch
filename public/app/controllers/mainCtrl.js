angular.module('mainCtrl', ['basicService'])

.controller('MainController', function($rootScope, $location, socketio, Basics) {
    var vm = this;
    var startButton = document.getElementById('startButton');
    var callButton = document.getElementById('callButton');
    var hangupButton = document.getElementById('hangupButton');

    var startTime;
    var localStream;
    var localVideo = document.getElementById('localVideo');
    var remoteVideo = document.getElementById('remoteVideo');
    var constraints = {
        audio: true,
        video: {
                mandatory: {
                    maxWidth: 1024,
                    maxHeight: 768,
                    minWidth: 640,
                    minHeight: 480
                }
            }
    }
    var isInitiator,
        room;

    /***
        Functions to interact with user and setup a video session
    ***/
    vm.startSession = function() {
        Basics.trace('Requesting local stream');
        startButton.disabled = true;
        navigator.mediaDevices.getUserMedia(constraints)
            .then(gotStream)
            .catch(function(e) {
              Basics.trace('getUserMedia() error: ' + e);
            });
    }
    vm.broadcastSession = function() {
        Basics.trace('Starting broadcast to public');
        callButton.disabled = true;
        hangupButton.disabled = false;
        startTime = window.performance.now();
        var videoTracks = localStream.getVideoTracks();
        var audioTracks = localStream.getAudioTracks();
        if (videoTracks.length > 0) {
            Basics.trace('Using video device: ' + videoTracks[0].label);
        }
        if (audioTracks.length > 0) {
            Basics.trace('Using audio device: ' + audioTracks[0].label);
        }
        // Connect a random room id for us and connect to socket server and ask socket server to create a room for us given that hash
        room = window.location.hash.substring(1);
        if (!room) {
            room = window.location.hash = randomToken();
        }
        socketio.emit('create or join', room);
        // Once room is created we can send our video to nodes connected to our room
        if (location.hostname.match(/localhost|127\.0\.0/)) {
            socketio.emit('ipaddr');
        }
        // Publish video to session
    }

    /***
        Helper functions
    ***/
    function createPeerConnection(isInitiator, config) {
        console.log('Creating Peer connection as initiator?', isInitiator, 'config:', config);
        peerConn = new RTCPeerConnection(config);

        // send any ice candidates to the other peer
        peerConn.onicecandidate = function(event) {
            console.log('icecandidate event:', event);
            if (event.candidate) {
                sendMessage({
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                });
            } else {
                console.log('End of candidates.');
            }
        };

        if (isInitiator) {
            console.log('Creating Data Channel');
            dataChannel = peerConn.createDataChannel('photos');
            onDataChannelCreated(dataChannel);

            console.log('Creating an offer');
            peerConn.createOffer(onLocalSessionCreated, logError);
        } else {
            peerConn.ondatachannel = function(event) {
                console.log('ondatachannel:', event.channel);
                dataChannel = event.channel;
                onDataChannelCreated(dataChannel);
            };
        }
    }
    function onDataChannelCreated(channel) {
        console.log('onDataChannelCreated:', channel);
        channel.onopen = function() {
            console.log('CHANNEL opened!!!');
        };
        channel.onmessage = (adapter.browserDetails.browser === 'firefox') ? receiveDataFirefoxFactory() : receiveDataChromeFactory();
    }
    function gotStream(stream) {
        Basics.trace('Received local stream');
        localVideo.srcObject = stream;
        localStream = stream;
        callButton.disabled = false;
    }
    function randomToken() {
        return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
    }
    /****************************************************************************
    * Signaling server
    ****************************************************************************/

    socketio.on('created', function(room, clientId) {
        console.log('Created room', room, '- my client ID is', clientId);
        isInitiator = true;
        // Now that our room is created we can stream our video
    });
    socketio.on('log', function(array) {
        console.log.apply(console, array);
    });
    socketio.on('ipaddr', function(ipaddr) {
        console.log('Server IP address is: ' + ipaddr);
    });

    /**
    * Send message to signaling server
    */
    function sendMessage(message) {
      console.log('Client sending message: ', message);
      socketio.emit('message', message);
    }
});
