let connection;
let conference;
let videoTrack;
let audioTrack;
let desktopTrack;
let isMuted;

const screenShareVideo = document.getElementById("screenShareVideo");
const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const startScreenShareBtn = document.getElementById('screenShareButton');
const muteBtn = document.getElementById('muteBtn');

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

const getToken = async () => {
  const body = {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey: "249202aabed00b41363794b526eee6927bd35cbc9bac36cd3edcaa",
      user: {
        id: generateRandomString(),
        name: generateRandomString(),
        email: "nick@gmail.com",
        avatar: "https://test.com/user/profile.jpg",
        moderator: true
      }
    })
  };

  try {
    const response = await fetch("https://api.sariska.io/api/v1/misc/generate-token", body);
    if (response.ok) {
      const json = await response.json();
      return json.token;
    } else {
      console.log(response.status);
    }
  } catch (error) {
    console.log('error', error);
  }
};


const startConnection = (token, roomName, localTracks) => {
  //Step 1
  connection = new SariskaMediaTransport.JitsiConnection(token, roomName, false);

  connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_ESTABLISHED, () => {
    createConference(connection, localTracks);
  });

  connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_FAILED, (error) => {
    if (error === SariskaMediaTransport.events.connection.PASSWORD_REQUIRED) {
      // token expired so have to set the token again
      connection.setToken(token)  
      console.log('connection disconnect!!!', error);
    }
  });

  connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_DISCONNECTED, (error) => {
    console.log('connection disconnect!!!', error);
  });

  connection.connect();
};

const createConference = async (connection, localTracks) => {
  // Step 2
  conference = await connection.initJitsiConference();

  conference.addEventListener(SariskaMediaTransport.events.conference.CONFERENCE_JOINED, () => {
    localTracks.forEach((track) => {
      conference.addTrack(track);
    });
  });

  conference.addEventListener(SariskaMediaTransport.events.conference.TRACK_ADDED, (track) => {
    if (track.isLocal()) {
      return;
    }
    if (track.getType() === "video") {
      track.attach(document.getElementById("remoteVideo"));
    }
  });

  conference.addEventListener(SariskaMediaTransport.events.conference.TRACK_REMOVED, (track) => {
    track.detach(document.getElementById("remoteVideo"));
  });

  conference.join();
};

const setupLocalStream = async () => {
  // step 3
  const options = {
    devices: ["audio", "video"],
    resolution: 240
  };

  const localTracks = await SariskaMediaTransport.createLocalTracks(options);

  audioTrack = localTracks.find(track => track.getType() === "audio");
  videoTrack = localTracks.find(track => track.getType() === "video");

  videoTrack.attach(document.getElementById("localVideo"));
  audioTrack.attach(document.getElementById("audioElement"))

  return localTracks;
};


const startCall = async () => {
  startCallBtn.disabled = true;
  endCallBtn.disabled = false;
  startScreenShareBtn.disabled = false;
  muteBtn.disabled = false;

  SariskaMediaTransport.initialize();
  const token = await getToken();
  const roomName = document.getElementById('roomNameInput').value || "randomroom";

  const localTracks = await setupLocalStream(token, roomName);
  startConnection(token, roomName, localTracks);
};

const toggleScreenSharing = async () => {
  if (!desktopTrack) {
    const optionsDesktop = {
      devices: ["desktop"]
    };
    desktopTrack = await SariskaMediaTransport.createLocalTracks(optionsDesktop);
    desktopTrack[0].attach(screenShareVideo);
    screenShareVideo.style.display = "block";
  } else {
    desktopTrack[0].dispose();
    desktopTrack = null;
    screenShareVideo.style.display = "none";
  }
};

const endCall = async () => {
  conference.leave();
  connection.disconnect();

  videoTrack.detach(document.getElementById("localVideo"));

  startCallBtn.disabled = false;
  endCallBtn.disabled = true;
};

const toggleMute = () =>{
  if (isMuted){
    unMuteAudio();
  }
  else{
    muteAudio();
  }
}

const muteAudio = () =>{
  if(audioTrack){
    audioTrack.mute();
  }

  isMuted = true;
  muteBtn.textContent = "Unmute";
}

const unMuteAudio = () =>{
 if(audioTrack){
  audioTrack.unmute();
 }

 isMuted = false;
 muteBtn.textContent = "mute";
}



// Bugs
// cannot disable the viideo
// Even after the call is ended the camera is still on