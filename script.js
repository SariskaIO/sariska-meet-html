let connection;
let conference;
let videoTrack;
var startCallBtn = document.getElementById('startCallBtn');
var endCallBtn = document.getElementById('endCallBtn');
function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';

    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

const getToken = async () => {
    const body = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            apiKey: "249202aabed00b41363794b526eee6927bd35cbc9bac36cd3edcaa",// enter your app secret
            user: {  // optional
                id: generateRandomString(),
                name: generateRandomString(),
                email: "nick@gmail.com",
                avatar: "https://test.com/user/profile.jpg",
                moderator: true // if participant is moderator pass true or leave it blank , sariska will automatically elect first participant as moderator if moderator leaves sariska promote someone else as a moderator. 
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
}

async function endCall(){
    conference.leave();
    connection.disconnect();

    videoTrack.detach(document.getElementById("localVideo"));
    
    startCallBtn.disabled = false;
    endCallBtn.disabled = true;
}

async function startCall() {

    
    startCallBtn.disabled = true;

    // Enable end call button and screen share checkbox

    endCallBtn.disabled = false;
    
    var screenShareCheckbox = document.getElementById('screenShareCheckbox');
    screenShareCheckbox.disabled = false;

    SariskaMediaTransport.initialize();
    const token = await getToken();
    roomname = document.getElementById('roomNameInput').value || generateRandomString();
    console.log("Room Name", roomname);

    const localTracks = await setupLocalStream(token, roomname);
    startConnection(token, roomname, localTracks);
}

function startConnection(token, roomname, localTracks) {
    connection = new SariskaMediaTransport.JitsiConnection(token, roomname, false);

    connection.addEventListener(
        SariskaMediaTransport.events.connection.CONNECTION_ESTABLISHED,
        () => {
            createConference(connection, localTracks);
            //console.log("Connection Established");
        }
    );

    connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_FAILED, (error) => {
        if (error === SariskaMediaTransport.events.connection.PASSWORD_REQUIRED) { // token expired set again
            console.log('connection disconnect!!!', error);
        }
    });


    connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_DISCONNECTED, (error) => {
        console.log('connection disconnect!!!', error);
    });

    connection.connect();
}

const createConference = async (connection, localTracks) => {

    conference = await connection.initJitsiConference();

    const remoteTracks = [];

    conference.addEventListener(
        SariskaMediaTransport.events.conference.CONFERENCE_JOINED,
        () => {
            localTracks.forEach((track) => {
                conference.addTrack(track)
            });
        }
    );

    conference.addEventListener(SariskaMediaTransport.events.conference.TRACK_ADDED, function (track) {

        // return since local track is already added
        if(track.isLocal()){
            console.log("Track is Local");
            return;
        }
        if(track.getType() == "video"){
            console.log("Track is Not local");
            track.attach(document.getElementById("remoteVideo"));
        }
    });

    conference.addEventListener(SariskaMediaTransport.events.conference.TRACK_REMOVED, function (track){
        console.log("Track removed");
        track.detach(document.getElementById("remoteVideo"));
    });

    conference.join();

}

async function setupLocalStream() {
    const options = {
        devices: ["audio", "video"],
        resolution: 240, // 180,  240,  360, vga, 480, qhd, 540, hd, 720, fullhd, 1080, 4k, 2160
    }

    const localTracks = await SariskaMediaTransport.createLocalTracks(options);

    const audioTrack = localTracks.find(track => track.getType() === "audio");

    console.log("audioTrack", audioTrack);

    videoTrack = localTracks.find(track => track.getType() === "video");

    videoTrack.attach(document.getElementById("localVideo"));

    return localTracks;
}