const createSocketConnection = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let token = await getToken("229b02aabece4e42203ed0bb3df1b5916edc44bf82b530887bdeb8");
      const params = { token };
      socket = new Phoenix.Socket("wss://api.sariska.io/api/v1/messaging/websocket", { params });
      socket.onOpen(() => {
        console.log("Connection open!");
        resolve(); // Resolve the promise when the connection is open
      });
      socket.onError(() => console.log("There was an error with the connection!"));
      socket.onClose(() => console.log("The connection dropped"));

      socket.connect();
    } catch (error) {
      console.error("Error creating socket connection:", error);
      reject(error); // Reject the promise if there's an error
    }
  });
};

const createSocketAndJoin = async () => {
  try {
    await createSocketConnection(); 
    joinChatRoom(); 
  } catch (error) {
    console.error("Error creating socket and joining chat room:", error);
  }
};

const joinChatRoom = () =>{
  roomName = document.getElementById("roomNameInput").value;
  channel = Phoenix.socket.channel(`chat:${roomName}`);

  channel.on("new_message", (message) =>{
    console.log(message);
    const messageBubble = document.createElement('div');
      messageBubble.classList.add('message-bubble');
      messageBubble.innerHTML = `
        <div class="message-info">
          <span class="message-sender">Participant: ${message.name}</span>
        </div>
        <div class="message-content">${message.content}</div>
      `;
        
        const messageDisplay = document.getElementById("messageDisplay");
        messageDisplay.appendChild(messageBubble);

        messageDisplay.scrollTop = messageDisplay.scrollHeight;
  });
  
  channel.join()
                .receive("ok", () => console.log("Channel Joined"))
                .receive("error", () => console.log("Failed to join"))
                .receive("timeout", () => console.log("Networking issue. Still waiting..."));
}

const leaveChatRoom = () => {
  channel.leave();
};

const sendMessage = () => {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;
  if (message.trim() !== '') {
    displayMessage(message); // Call the displayMessage function to show the message in the toggle area

    const roomName = document.getElementById("roomNameInput").value;
    const channel = socket.channel(`chat:${roomName}`);
    
    // Join the channel before pushing the message event
    channel.join()
      .receive("ok", () => {
        console.log("Channel Joined");
        // Push the message event after joining the channel
        channel.push("new_message", { content: message })
          .receive("ok", () => console.log("Message sent"))
          .receive("error", () => console.log("Failed to send message"));
      })
      .receive("error", () => console.log("Failed to join"))
      .receive("timeout", () => console.log("Networking issue. Still waiting..."));
    
    messageInput.value = '';
  }
};

const toggleTextArea = () => {
    const messageContainer = document.getElementById("messageContainer");
    if (messageContainer.style.display === 'none') {
      messageContainer.style.display = 'inline';
    } else {
      messageContainer.style.display = 'none';
    }
  };

  const displayMessage = (message) => {
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');
    messageBubble.innerHTML = `
      <div class="message-info">
        <span class="message-sender">You</span>
      </div>
      <div class="message-content">${message}</div>
    `;
  
    const messageDisplay = document.getElementById("messageDisplay");
    messageDisplay.appendChild(messageBubble);
  
    messageDisplay.scrollTop = messageDisplay.scrollHeight;
  };