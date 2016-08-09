/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

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
};

startButton.onclick = start;

function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}

function gotStream(stream) {
    trace('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    var videoTracks = localStream.getVideoTracks();
    var audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
        trace('Using video device: ' + videoTracks[0].label);
    }
    if (audioTracks.length > 0) {
        trace('Using audio device: ' + audioTracks[0].label);
    }
}

function start() {
    trace('Requesting local stream');
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia(constraints)
        .then(gotStream)
        .catch(function(e) {
          trace('getUserMedia() error: ' + e);
        });
}
