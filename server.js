require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const port = process.env.SERVER_PORT;
const { createRoom, joinRoom, getAccessToken, kickParticipant } = require('./Modules/Room');

// use the Express JSON middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile("public/index.html");
});

app.post("/room/create", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  if (!req.body.roomName) {
    return res.status(400).send("Must include roomName parameter.");
  } else if(!req.body.group) {
    return res.status(400).send("Must include group parameter.");
  }
  const roomName = req.body.roomName;
  const isGroup = req.body.group;
  
  // find or create a room with the given roomName
  let room = await createRoom(roomName, isGroup);

  if(room.success) {
    res.send({
      success: true,
      message: 'Room ' + room.room.uniqueName + ' created!',
      room: room.room,
    });
  } else {
    res.send({
      success: false,
      message: room.message,
    });
  }
});

app.post("/room/join", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  if (!req.body || !req.body.roomName) {
    return res.status(400).send("Must include roomName argument.");
  }
  const roomName = req.body.roomName;
  // find or create a room with the given roomName
  let room = await joinRoom(roomName);
  
  // generate an Access Token for a participant in this room
  const token = getAccessToken(roomName);
  
  if(room.success) {
    res.send({
      success: room.success,
      message: "join room success!",
      token: token,
      room: room,
    });
  } else {
    res.send({
      success: room.success,
      message: '',
    });
  }
})

app.post("/room/participant/kick", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  if (!req.body || !req.body.roomName) {
    return res.status(400).send("Must include roomName argument.");
  } else if (!req.body || !req.body.sid) {
    return res.status(400).send("Must include sid participant argument.");
  }
  const roomName  = req.body.roomName;
  const sid       = req.body.sid;

  // find or create a room with the given roomName
  let participant = await kickParticipant(roomName, sid);

  res.send({
    sid: participant.sid,
    identity: participant.identity
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
