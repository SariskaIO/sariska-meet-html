let connection;
let conference;
let videoTrack;
let audioTrack;
let desktopTrack;
let isMuted;
let isVideoDisabled;
let socket;
let channel;
let apiKey;

let roomName;
const screenShareVideo = document.getElementById("screenShareVideo");
const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const startScreenShareBtn = document.getElementById('screenShareButton');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');

// Messaging constants
const messageBtn = document.getElementById('messageBtn');
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messageDisplay = document.getElementById('messageDisplay');

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const randomValues = new Uint32Array(5);
  window.crypto.getRandomValues(randomValues);
  let result = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = randomValues[i] % characters.length;
    result += characters.charAt(randomIndex);
  }

  return result;
};

const getToken = async (apiKey) => {
  const body = {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // apiKey: "249202aabed00b41363794b526eee6927bd35cbc9bac36cd3edcaa",
      apiKey: apiKey,
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

  if (!localTracks) {
    console.log('Local tracks not created');
    return;
  }

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
  videoBtn.disabled = false;
  messageBtn.disabled = false;

  SariskaMediaTransport.initialize();
  const token = await getToken("249202aabed00b41363794b526eee6927bd35cbc9bac36cd3edcaa");
  if (!token) {
    console.log('Token not received from server');
    return;
  }
  const roomName = document.getElementById('roomNameInput').value;

  if (!roomName) {
    alert("Please enter a room name.");
    startCallBtn.disabled = false; 
    endCallBtn.disabled = true; 
    startScreenShareBtn.disabled = true; 
    muteBtn.disabled = true;
    videoBtn.disabled = true;
    return;

  }

  const localTracks = await setupLocalStream(token, roomName);
  startConnection(token, roomName, localTracks);
  createSocketConnection();
  joinChatRoom();
};

const toggleScreenSharing = async () => {
  if (!desktopTrack) {
    const optionsDesktop = {
      devices: ["desktop"]
    };
    desktopTrack = await SariskaMediaTransport.createLocalTracks(optionsDesktop);
    desktopTrack[0].attach(screenShareVideo);
    screenShareVideo.style.display = "block";
    startScreenShareBtn.innerText = "Stop Sharing";
  } else {
    desktopTrack[0].dispose();
    desktopTrack = null;
    screenShareVideo.style.display = "none";
    startScreenShareBtn.innerText = "Start Sharing";
  }
};

const endCall = async () => {
  conference.leave();
  connection.disconnect();

  // added dispose here instead of detach because with detach webcam was still onn even after the meet was ended.
  videoTrack.dispose(document.getElementById("localVideo"));
  audioTrack.dispose(document.getElementById("audioElement"));

  if (desktopTrack) {
    desktopTrack[0].dispose();
    desktopTrack = null;
    screenShareVideo.style.display = "none";
    startScreenShareBtn.innerText = "Start Sharing"; 
  }

  const roomNameInput = document.getElementById('roomNameInput');
  roomNameInput.value = '';
  
  startCallBtn.disabled = false;
  endCallBtn.disabled = true;
  startScreenShareBtn.disabled = true;
  muteBtn.disabled = true;
  videoBtn.disabled = true;
  messageBtn.disabled = true;
};

// functions for mute button start

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

// functions for mute button end

// functions for video start

const toggleVideo = () =>{
  if(isVideoDisabled){
    enableVideo();
  }
  else{
    disableVideo();
  }
}

const enableVideo = () =>{
  if(videoTrack){
    videoTrack.attach(document.getElementById("localVideo"));
  }
  isVideoDisabled = false;
  videoBtn.textContent = "Disable Video";
  console.log("video enabled");
}

const disableVideo = () =>{
  if(videoTrack){
    videoTrack.detach(document.getElementById("localVideo"));
  }
  isVideoDisabled = true;
  videoBtn.textContent = "Enable Video";
  console.log("video disabled");
}
// functions for video end





  // Message sending functionality by conference.sendMessage
// const sendMessage = () => {
//   console.log("button clicked");
//   const message = messageInput.value;
//   if (message.trim() !== '') {
    
//     conference.sendMessage(message); 

//     console.log(message);
//     messageInput.value = '';

    

//   }
// };


// Message received functionality by conference.receive
//   conference.addEventListener(SariskaMediaTransport.events.conference.MESSAGE_RECEIVED, (participantId,message) => {
//       console.log("message received");
//       console.log(participantId,message);

//       const messageBubble = document.createElement('div');
//       messageBubble.classList.add('message-bubble');
//       messageBubble.innerHTML = `
//         <div class="message-info">
//           <span class="message-sender">Participant: ${participantId}</span>
//         </div>
//         <div class="message-content">${message}</div>
//       `;

//         messageDisplay.appendChild(messageBubble);

//         messageDisplay.scrollTop = messageDisplay.scrollHeight;
//   } 
// )

// Message function ends





