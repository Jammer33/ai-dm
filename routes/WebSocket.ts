import { Server } from "socket.io";
import DungeonMasterController from "../controllers/DungeonMasterController";
import MessageController from "../controllers/MessageController";
import socketAuth from "../middleware/SocketAuth";
import RoomController from "../controllers/RoomController";
import RoomQueries from "../queries/RoomQueries";

const DM_COMPLETION_TOKEN = "[DONE]";

/* we use the user token to identify the user and the  campaignToken to identify the game
    we do not want to store the user object on socket.decoded 
    to avoid making queries to the user database on every WS message */
const socket = (io: Server) => {
    // io.use(SocketErrorHandler);
    io.use(socketAuth);

    console.log("socket.io is listening for connections");

    io.on("connection", (socket) => {
        let cachedSessionToken = ""; // keep track of the session token for this socket

        socket.on("disconnect", () => {
            if(!socket.decoded) {
                console.log("user disconnected without a token");
                return;
            }

            console.log("cached session token " + cachedSessionToken);
            RoomController.leaveRoom(socket.decoded["userToken"], cachedSessionToken); // mark the player as inactive in the room
        }); 

        socket.on("reply", (message, campaignToken) => {
            console.log("campaignToken: " + campaignToken);
            MessageController.findPlayerEmailFromToken(socket.decoded["userToken"])
            .then((playerEmail) => {
                let formattedMessage = new Map<String, String> ([
                    ["player", playerEmail], ["message", message]]);
                io.to(campaignToken).emit("reply", JSON.stringify(Array.from(formattedMessage))); 
                
                MessageController.storeMessageAndActivateDM(campaignToken, socket.decoded["userToken"], message, io.to(campaignToken)).then(() => {
                    io.to(campaignToken).emit("DMessage", DM_COMPLETION_TOKEN);
                }).catch((err) => {
                    console.log("Could not store the message: " + err);
                });
            }).catch((err) => {
                console.log("Could not find player email: " + err);
            });
        });

        socket.on("joinGame", async (campaignToken) => {
            cachedSessionToken = campaignToken;
            socket.join(campaignToken);
            // check if the user is already in the room
            if (await RoomQueries.isPlayerInRoom(socket.decoded["userToken"], campaignToken)) {
                console.log("user already in this campaign. Just adding to socket room.");
            } else {
                RoomController.joinRoom(socket.decoded["userToken"], campaignToken).then(() => {
                    // send a message informing the other participants
                    MessageController.findPlayerEmailFromToken(socket.decoded["userToken"])
                    .then((playerEmail) => {
                        let formattedMessage = new Map<String, String> ([
                            ["player", playerEmail ?? ""], ["message", "Joined"]]);
                        io.to(campaignToken).emit("reply", JSON.stringify(Array.from(formattedMessage))); 
                    }).catch((err) => {
                        console.log("Could not find player email: " + err);
                    });
                }).catch((err) => {
                    console.log("Could not broadcast joining message" + err);
                    socket.emit("error", "could not join the room");
                    return;
                });
            }

            // get the last interaction from the DM and recent player messages to pass to the client
            DungeonMasterController.getLastDMInteraction(campaignToken).then((DMResponse) => {
                // overcomes a bug in the default JS map object with JSON serialization
                let prevMessages = new Map<String, String>(); 

                MessageController.getRecentMessages(campaignToken).then((messages : Map<String, String>) => {
                    for(let key of messages.keys()) {
                        prevMessages.set(key, messages.get(key) ?? "");
                    }
                }).catch((err) => {
                    console.log("Could not find previous interaction: " + err);
                });
                prevMessages.set("DM", DMResponse);

                console.log("sending previous messages: " + JSON.stringify(Array.from(prevMessages)));
                socket.emit("joinGame", JSON.stringify(Array.from(prevMessages)));
            }).catch((err) => {
                console.log("Could not find the last DM interaction: " + err);
            });
        });

        socket.on("newGame", (characters, name : "", description : "") => {
            RoomController.createRoom(socket.decoded["userToken"], name, description).then((campaignToken) => { 
                if(campaignToken == "") {
                    console.log("Could not create a new room");
                    return;
                }
                cachedSessionToken = campaignToken;
                socket.join(campaignToken);
                DungeonMasterController.initStoryStreamed(characters, campaignToken, io.to(campaignToken)).then(() => {
                    io.to(campaignToken).emit("DMessage", DM_COMPLETION_TOKEN);
                }).catch((err) => {
                    console.log("Could not start the story: " + err);
                });
                socket.emit("newGame", campaignToken);
            }).catch((err) => {
                console.log(err);
            });
        });

        socket.on("tts", (message, campaignToken, playbackSpeed) => {
            DungeonMasterController.requestTTSAudio(message, io.to(campaignToken), playbackSpeed).then(() => {
                console.log("TTS request sent");
            }).catch((err) => {
                console.log("Could not send TTS request: " + err);
            });
        });
    });
}

export default socket;