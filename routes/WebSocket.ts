import { Server } from "socket.io";
import DungeonMasterController from "../controllers/DungeonMasterController";
import MessageController from "../controllers/MessageController";
import socketAuth from "../middleware/SocketAuth";
import RoomController from "../controllers/RoomController";
import RoomQueries from "../queries/RoomQueries";
import MessageQueries from "../queries/MessageQueries";
import { Character } from "../models/Character";
import MemoryService from "../services/MemoryService";

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
    
            let formattedMessage = {content: message, userToken: socket.decoded["userToken"], createdAt: new Date()};
            io.to(campaignToken).emit("reply", formattedMessage); 
            
            MessageController.storeMessageAndActivateDM(campaignToken, socket.decoded["userToken"], message, io.to(campaignToken)).then(() => {
                io.to(campaignToken).emit("DMessage", DM_COMPLETION_TOKEN);
            }).catch((err) => {
                console.log("Could not store the message: " + err);
            });
        });

        socket.on("joinGame", async (campaignToken, character: Character) => {
            cachedSessionToken = campaignToken;
            socket.join(campaignToken);
            let joinRoomMessage;
            // check if the user is already in the room
            if (await RoomQueries.isPlayerInRoom(socket.decoded["userToken"], campaignToken)) {
                console.log("user already in this campaign. Just adding to socket room.");
                await RoomController.rejoinRoom(socket.decoded["userToken"], campaignToken);
            } else {
                await RoomController.joinRoom(socket.decoded["userToken"], campaignToken, character)
                joinRoomMessage = character.name + " the " + character.race + " " + character._class + " has joined the game!";
                await loadRoom(campaignToken, { [socket.decoded["userToken"]]: character.name });
                MemoryService.storeMessage(joinRoomMessage, campaignToken, "DM")
                io.to(campaignToken).emit("reply", {content: joinRoomMessage, userToken: "DM", createdAt: new Date()});
                return;
            }

            loadRoom(campaignToken);
        });

        const loadRoom = async (campaignToken: string, updateAllPlayerLists: {} | null= null) => {
            const userTokenToCharacterNameMap = await RoomQueries.getUserTokenToCharacterNameMap(campaignToken);

            const messages = await MessageQueries.getMessagesForCampaign(campaignToken, 20, 0)
            socket.emit("joinGame", messages, {...Object.fromEntries(userTokenToCharacterNameMap)});

            if (updateAllPlayerLists) {
                io.to(campaignToken).emit("updatePlayerList", {...Object.fromEntries(userTokenToCharacterNameMap), ...updateAllPlayerLists});
            }
        }


        socket.on("newGame", (character, name : "", description : "") => {
            RoomController.createRoom(socket.decoded["userToken"], name, description, character).then((campaignToken) => { 
                if(campaignToken == "") {
                    console.log("Could not create a new room");
                    return;
                }
                cachedSessionToken = campaignToken;
                socket.join(campaignToken);
                DungeonMasterController.initStoryStreamed(character, campaignToken, io.to(campaignToken)).then(() => {
                    io.to(campaignToken).emit("DMessage", DM_COMPLETION_TOKEN);
                }).catch((err) => {
                    console.log("Could not start the story: " + err);
                });
                socket.emit("newGame", campaignToken, { [socket.decoded["userToken"]]: character.name });
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