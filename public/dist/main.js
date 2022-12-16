const form = document.getElementById("room-name-form");
const joinForm = document.getElementById("join-room-form");
const roomNameInput = document.getElementById("room-name-input");
const joinRoomInput = document.getElementById("join-room-input");
const container = document.getElementById("video-container");

const createRoom = async (event) => {
  // prevent a page reload when a user submits the form
  event.preventDefault();

  // retrieve the room name
  const roomName = roomNameInput.value;

  // fetch an Access Token from the join-room route
  const response = await fetch("/room/create", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      roomName: roomName,
      group: true
    }),
  });

  const resJson = await response.json();

  alert(resJson.message)
  roomNameInput.value = ''
};

const startRoom = async (event) => {
  // prevent a page reload when a user submits the form
  event.preventDefault();
  // hide the create form
  form.style.visibility = "hidden";
  // hide the join form
  joinForm.style.visibility = "hidden";
  // retrieve the room name
  const roomName = joinRoomInput.value;

  // fetch an Access Token from the join-room route
  const response = await fetch("/room/join", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomName: roomName,
      group: true,
    }),
  });

  const { success, message, token } = await response.json();

  if(success) {
    // join the video room with the token
    const room = await joinVideoRoom(roomName, token);

    // set variable participant
    let participant = room.localParticipant;

    // render the local and remote participants' video and audio tracks
    handleConnectedParticipant(participant);
    room.participants.forEach(handleConnectedParticipant);
    room.on("participantConnected", handleConnectedParticipant);

    // handle cleanup when a participant disconnects
    room.on("participantDisconnected", handleDisconnectedParticipant);
    window.addEventListener("pagehide", () => room.disconnect());
    window.addEventListener("beforeunload", () => room.disconnect());
  } else {
    alert(message);

    // show the create & join form
    form.style.visibility = "visible";
    joinForm.style.visibility = "visible";
    roomNameInput.value = "";
    joinRoomInput.value = "";
  }
};

const handleConnectedParticipant = (participant) => {
  // create a div for this participant's tracks
  const participantDiv = document.createElement("div");
  participantDiv.setAttribute("id", participant.identity);

  container.appendChild(participantDiv);

  const buttonDisconnect = document.createElement("button");

  buttonDisconnect.setAttribute("id", "disconnect" + participant.sid);
  buttonDisconnect.setAttribute("data-sid", participant.sid);
  buttonDisconnect.innerText = "Disconnect";
  container.appendChild(buttonDisconnect);

  buttonDisconnect.addEventListener('click', function () { 
    let sid = this.getAttribute('data-sid')

    setDisconnected(joinRoomInput.value, sid)
  })

  // iterate through the participant's published tracks and
  // call `handleTrackPublication` on them
  participant.tracks.forEach((trackPublication) => {
    handleTrackPublication(trackPublication, participant);
  });

  // listen for any new track publications
  participant.on("trackPublished", handleTrackPublication);
};

const joinVideoRoom = async (roomName, token) => {
  // join the video room with the Access Token and the given room name
  const room = await Twilio.Video.connect(token, {
    room: roomName
  });
  return room;
};

const handleTrackPublication = (trackPublication, participant) => {
  function displayTrack(track) {
    // append this track to the participant's div and render it on the page
    const participantDiv = document.getElementById(participant.identity);
    // track.attach creates an HTMLVideoElement or HTMLAudioElement
    // (depending on the type of track) and adds the video or audio stream
    participantDiv.append(track.attach());
  }

  // check if the trackPublication contains a `track` attribute. If it does,
  // we are subscribed to this track. If not, we are not subscribed.
  if (trackPublication.track) {
    displayTrack(trackPublication.track);
  }

  // listen for any new subscriptions to this track publication
  trackPublication.on("subscribed", displayTrack);
}

const handleDisconnectedParticipant = (participant) => {
  // stop listening for this participant
  participant.removeAllListeners();
  // remove this participant's div from the page
  const participantDiv = document.getElementById(participant.identity);
  participantDiv.remove();
};

async function setDisconnected(roomName, participantSid) {
  alert('Participant with sid: '+participantSid+' will be kicked from room!')
  // kick participant to kick-room route
  const response = await fetch("/room/participant/kick", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomName: roomName,
      sid: participantSid,
    }),
  });

  const { sid, identity } = await response.json();

  // stop listening for this participant
  const participantDiv = document.getElementById(identity);
  const buttonDisconnect = document.getElementById("disconnect" + sid);

  console.log(`participant disconnected sid: ${sid}`)

  participantDiv.remove();
  buttonDisconnect.remove();

  // show the create & join form
  form.style.visibility = "visible";
  joinForm.style.visibility = "visible";
  roomNameInput.value = "";
  joinRoomInput.value = "";
};

form.addEventListener("submit", createRoom);
joinForm.addEventListener("submit", startRoom);