angular.module('mainCtrl', ['basicService'])

.controller('MainController', function($rootScope, $location, $window, socketio, Basics) {
    var vm = this;
    var startButton = document.getElementById('startButton');
    var callButton = document.getElementById('callButton');
    var hangupButton = document.getElementById('hangupButton');

    var startTime;
    var recordedBlobs;
    vm.localStream = {};
    vm.remoteStream = {};
    var localVideo = document.getElementById('localVideo');
    var remoteVideo = document.getElementById('remoteVideo');
    var constraints = {
        audio: true,
        video: {
                mandatory: {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    minWidth: 800,
                    minHeight: 600
                }
            }
    }
    var configuration = null;
    vm.datachannel = {};

    /***
        Functions to interact with user and setup a video session
    ***/
    vm.startSession = function() {
        Basics.trace('Requesting local stream');
        startButton.disabled = true;
        grabWebCamVideo();
    }
    vm.stopSession = function() {
        mediaRecorder.stop();
        console.log('Recorded Blobs: ', recordedBlobs);
    }
    vm.play = function() {
        var superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
        remoteVideo.controls = true;
        remoteVideo.src = window.URL.createObjectURL(superBuffer);
    }
    vm.broadcastLocal = function() {
        var options = { mimeType: 'video/webm', bitsPerSecond: 100000 };
        recordedBlobs = [];
        try {
            mediaRecorder = new MediaRecorder(vm.localStream, options);
        } catch(e0) {
            console.log('Unable to create MediaRecorder with options Object: ', e0);
            try {
                options = {mimeType: 'video/webm,codecs=vp9', bitsPerSecond: 100000};
                mediaRecorder = new MediaRecorder(vm.localStream, options);
            } catch(e1) {
                console.log('Unable to create MediaRecorder with options Object: ', e1);
                try {
                    options = 'video/vp8'; // Chrome 47
                    mediaRecorder = new MediaRecorder(vm.localStream, options);
                } catch(e2) {
                    alert('MediaRecorder is not supported by this browser.\n\n' + 'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
                    console.error('Exception while creating MediaRecorder:', e2);
                    return;
                }
            }
        }
        console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
        mediaRecorder.onstop = handleStop;
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start(10);
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
    function gotRemoteStream(e) {
        remoteVideo.srcObject = e.stream;
        trace('pc2 received remote stream');
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
    function handleDataAvailable(event) {
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }
    function handleStop(event) {
        console.log('Recorder stopped: ', event);
    }
});
