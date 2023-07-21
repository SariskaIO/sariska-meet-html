const submitApiKey = () => {
    const apiKeyInput = document.getElementById('apiKeyInput');
    apiKey = apiKeyInput.value;
    if (apiKey.trim() !== '') {
        // Enable the "Go Live" button after the API key is submitted
        console.log("API key submitted");
        const goLiveBtn = document.getElementById('goLiveBtn');
        goLiveBtn.disabled = false;
    } else {
        alert('Please enter a valid API key.');
    }
  };
  
  
  const goLive = async () => {
    if (!apiKey) {
        alert('Please submit your API key first.');
        return;
    }
    const token = await getToken(apiKey);
    try {
        const response = await fetch("https://api.sariska.io/terraform/v1/hooks/srs/startRecording", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                room_name: roomName,
            })
        });
  
        if (response.ok) {
            // Successfully started live streaming
            const liveStreamingData = await response.json();
            console.log("Live streaming started:", liveStreamingData);
            showLiveStreamFrame(liveStreamingData); 
        } else {
            console.log("Failed to start live streaming:", response.status);
        }
    } catch (error) {
        console.log("Error while starting live streaming:", error);
    }
  };
  
  const showLiveStreamFrame = (liveStreamingData) => {
    if(Hls.isSupported()){
      const liveStreamContainer = document.querySelector('.live-stream-container');
      const hls = new Hls();
      hls.attachMedia(liveStreamContainer);
                  hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                      hls.loadSource(
                          'https://customer-m033z5x00ks6nunl.cloudflarestream.com/b236bde30eb07b9d01318940e5fc3eda/manifest/video.m3u8'
                      );
          });
              }
    liveStreamContainer.style.display = 'block';
    liveStreamContainer.innerHTML = ''; 
    liveStreamContainer.play();
  }
  