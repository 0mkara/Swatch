angular.module('mainCtrl', ['basicService'])

.controller('MainController', function($rootScope, $location, $window, socketio, Basics) {
    var vm = this;
    var startButton = document.getElementById('startButton');
    var callButton = document.getElementById('callButton');
    var hangupButton = document.getElementById('hangupButton');

    var startTime;
    vm.localStream = {};
    vm.remoteStream = {};
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
    var configuration = null;
    vm.datachannel = {};
    room = window.location.hash.substring(1);
    if(room) {
        socketio.emit('create or join', room);
    }
    vm.roomUrl = window.location.origin + '/' + room;

    /***
        Functions to interact with user and setup a video session
    ***/
    vm.startSession = function() {
        Basics.trace('Requesting local stream');
        startButton.disabled = true;
        grabWebCamVideo();
    }
    vm.broadcastSession = function() {
        Basics.trace('Starting broadcast to public');
        callButton.disabled = true;
        hangupButton.disabled = false;
        startTime = window.performance.now();
        var videoTracks = vm.localStream.getVideoTracks();
        var audioTracks = vm.localStream.getAudioTracks();
        if (videoTracks.length > 0) {
            Basics.trace('Using video device: ' + videoTracks[0].label);
        }
        if (audioTracks.length > 0) {
            Basics.trace('Using audio device: ' + audioTracks[0].label);
        }
        // Connect a random room id for us and connect to socket server and ask socket server to create a room for us given that hash
        room = window.location.pathname.split('/')[1];
        if (!room) {
            room = window.location.hash = randomToken();
        }
        socketio.emit('create or join', room);
        // Once room is created we can send our video to nodes connected to our room
        if (location.hostname.match(/localhost|127\.0\.0/)) {
            socketio.emit('ipaddr');
        }
        // Publish video to session
        //vm.datachannel.send(vm.localStream);
    }

    /***
        Helper functions
    ***/
    function grabWebCamVideo() {
        console.log('Getting user media (video) ...');
        navigator.mediaDevices.getUserMedia(constraints)
            .then(gotStream)
            .catch(function(e) {
                console.log('getUserMedia() error: ' + e);
            });
    }
    function signalingMessageCallback(message) {
        if (message.type === 'offer') {
            console.log('Got offer. Sending answer to peer.');
            peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
            logError);
            peerConn.createAnswer(onLocalSessionCreated, logError);
        } else if (message.type === 'answer') {
            console.log('Got answer.');
            peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {}, logError);
        } else if (message.type === 'candidate') {
            console.log('Got candidate.');
            peerConn.addIceCandidate(new RTCIceCandidate({
                candidate: message.candidate
            }));
        } else if (message === 'bye') {
            // TODO: cleanup RTC connection?
        }
    }
    function createPeerConnection(isInitiator, config) {
        // if not initiator then pc2 else pc1
        console.log('Creating Peer connection as initiator?', isInitiator, 'config:', config);
        peerConn = new RTCPeerConnection(config);
        console.log(peerConn);

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
        peerConn.oniceconnectionstatechange = function(event) {
            console.log('icecandidate state change event:', event);
        }
        peerConn.onaddstream = function(event) {
            console.log('onaddstream:', event);
            document.getElementById('remoteVideo').srcObject = event.stream;
        };
        if(vm.localStream.active == true) {
            peerConn.addStream(vm.localStream);
        }

        if (isInitiator) {
            console.log('Creating Data Channel');
            vm.datachannel = peerConn.createDataChannel('audio_video');
            onDataChannelCreated(vm.datachannel);
            console.log('Creating an offer');
            peerConn.createOffer(onLocalSessionCreated, logError);
            console.log(vm.localStream);
        } else {
            peerConn.ondatachannel = function(event) {
                console.log('ondatachannel:', event.channel);
                vm.datachannel = event.channel;
                onDataChannelCreated(vm.datachannel);
            };
        }
    }
    function gotRemoteStream(e) {
        remoteVideo.srcObject = e.stream;
        trace('pc2 received remote stream');
    }

    function onDataChannelCreated(channel) {
        console.log('onDataChannelCreated:', channel);
        channel.onopen = function() {
            console.log('CHANNEL opened!!!');
        };
        channel.onmessage = (adapter.browserDetails.browser === 'firefox') ? receiveDataFirefoxFactory() : receiveDataChromeFactory();
    }
    function gotStream(stream) {
        console.log('Received local stream');
        var streamURL = window.URL.createObjectURL(stream);
        console.log('getUserMedia video stream URL:', streamURL);
        document.getElementById('localVideo').srcObject = stream;
        vm.localStream = stream;
        document.getElementById('callButton').disabled = false;
    }
    function randomToken() {
        return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
    }
    function receiveDataChromeFactory() {
        var buf, count;

        return function onmessage(event) {
            if (typeof event.data === 'string') {
                buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
                count = 0;
                console.log('Expecting a total of ' + buf.byteLength + ' bytes');
                return;
            }

            var data = new Uint8ClampedArray(event.data);
            buf.set(data, count);

            count += data.byteLength;
            console.log('count: ' + count);

            if (count === buf.byteLength) {
                // we're done: all data chunks have been received
                console.log('Done. Rendering photo.');
                renderPhoto(buf);
            }
        };
    }
    function receiveDataFirefoxFactory() {
        var count, total, parts;

        return function onmessage(event) {
            if (typeof event.data === 'string') {
                total = parseInt(event.data);
                parts = [];
                count = 0;
                console.log('Expecting a total of ' + total + ' bytes');
                return;
            }

            parts.push(event.data);
            count += event.data.size;
            console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) + ' to go.');

            if (count === total) {
                console.log('Assembling payload');
                var buf = new Uint8ClampedArray(total);
                var compose = function(i, pos) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        buf.set(new Uint8ClampedArray(this.result), pos);
                        if (i + 1 === parts.length) {
                            console.log('Done. Rendering photo.');
                            renderPhoto(buf);
                        } else {
                            compose(i + 1, pos + this.result.byteLength);
                        }
                    };
                    reader.readAsArrayBuffer(parts[i]);
                };
                compose(0, 0);
            }
        };
    }
    function onLocalSessionCreated(desc) {
        console.log('local session created:', desc);
        peerConn.setLocalDescription(desc, function() {
            console.log('sending local desc:', peerConn.localDescription);
            sendMessage(peerConn.localDescription);
        }, logError);
    }
    /**
    * Send message to signaling server
    */
    function sendMessage(message) {
      console.log('Client sending message: ', message);
      socketio.emit('message', message);
    }
    function logError(err) {
        console.log(err.toString(), err);
    }
    /****************************************************************************
    * Signaling server
    ****************************************************************************/

    socketio.on('created', function(room, clientId) {
        console.log('Created room', room, '- my client ID is', clientId);
        isInitiator = true;
        // Now that our room is created we can stream our video
        grabWebCamVideo();
    });
    socketio.on('log', function(array) {
        console.log.apply(console, array);
    });
    socketio.on('ipaddr', function(ipaddr) {
        console.log('Server IP address is: ' + ipaddr);
    });
    socketio.on('joined', function(room, clientId) {
        console.log('This peer has joined room', room, 'with client ID', clientId);
        isInitiator = false;
        createPeerConnection(isInitiator, configuration);
    });
    socketio.on('ready', function() {
        console.log('Socket is ready');
        createPeerConnection(isInitiator, configuration);
    });
    socketio.on('full', function(room) {
        alert('Room ' + room + ' is full. We will create a new room for you.');
        window.location.hash = '/';
        window.location.reload();
    });
    socketio.on('message', function(message) {
        console.log('Client received message:', message);
        signalingMessageCallback(message);
    });
});
