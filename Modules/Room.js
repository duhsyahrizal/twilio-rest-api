const { v4: uuidv4 } = require("uuid");
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// create the twilioClient
const twilioClient = require("twilio")(
  process.env.TWILIO_API_KEY_SID,
  process.env.TWILIO_API_KEY_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const createRoom = async (roomName, group) => {
  let type = group === 'true' ? 'group' : 'go';

  try {
    const roomCreated = await twilioClient.video.rooms.create({
      uniqueName: roomName,
      type: type,
    });

    return {
      success: true,
      message: "room created!",
      room: roomCreated
    };
  } catch (error) {
    if(error.code == 53113) {
      return {
        success: false,
        message: 'room existed!'
      }
    } else {
      // let other errors bubble up
      throw error;
    }
  }
};

const joinRoom = async (roomName) => {
  try {
    const room = await twilioClient.video.rooms(roomName).fetch();

    return {
      success: true,
      message: 'Room ' + room.uniqueName + ' fetched!',
      room: room
    };
  } catch (error) {
    if(error.code == 20404) {
      return {
        success: false,
        message: 'Room ' + roomName + ' was not found!'
      }
    } else {
      return {
        success: false,
        message: JSON.stringify(error),
      }
    }
  }
}

const getAccessToken = (roomName) => {
  // create an access token
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    // generate a random unique identity for this participant
    { identity: uuidv4() }
  );
  // create a video grant for this specific room
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  // add the video grant
  token.addGrant(videoGrant);
  // serialize the token and return it
  return token.toJwt();
};

const kickParticipant = async (roomName, sid) => {
  let participantDisconnected = await twilioClient.video
    .rooms(roomName)
    .participants(sid)
    .update({ status: "disconnected" })
    .then((participant) => {
      return participant;
    });
                        
  return participantDisconnected;
}

module.exports = { createRoom, joinRoom, getAccessToken, kickParticipant };
