angular.module('mainCtrl', ['basicService', 'opentok'])

.controller('MainController', function($rootScope, $location, Basics) {
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

    function gotStream(stream) {
        Basics.trace('Received local stream');
        localVideo.srcObject = stream;
        localStream = stream;
        callButton.disabled = true;
    }

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
        // Create a new session to broadcast video
        var session = OT.initSession(credentials.apiKey, credentials.sessionId);
        // Publish video to session
    }
});
