import { Server } from "socket.io";
import DungeonMasterController from "../controllers/DungeonMasterController";
import MessageController from "../controllers/MessageController";
import { SocketErrorHandler } from "../middleware/ErrorHandler";
import socketAuth from "../middleware/SocketAuth";
import RoomController from "../controllers/RoomController";

/* we use the user token to identify the user and the session token to identify the game
    we do not want to store the user object on socket.decoded 
    to avoid making queries to the user database on every WS message */
const socket = (io: Server) => {
    // io.use(SocketErrorHandler);
    io.use(socketAuth);

    console.log("socket.io is listening for connections");

    io.on("connection", (socket) => {
        console.log("a user connected");

        socket.on("disconnect", () => {
            console.log("user disconnected");
        }); 

        socket.on("message", (message, sessionToken) => {
            console.log("sessionToken: " + sessionToken);
            MessageController.storeMessageAndActivateDM(sessionToken, socket.decoded["userToken"], message, io.to(sessionToken));
        });

        socket.on("joinGame", async (sessionToken) => {
            socket.join(sessionToken);
            RoomController.joinRoom(socket.decoded["userToken"], sessionToken).then(() => {
                io.to(sessionToken).emit("message", "\na player joined\n");
            }).catch((err) => {
                console.log("Could not broadcast joining message" + err);
                socket.emit("error", "could not join the room");
                return;
            });

            // get the last interaction from the DM and recent player messages to pass to the client
            DungeonMasterController.getLastDMInteraction(sessionToken).then((DMResponse) => {
                // overcomes a bug in the default JS map object with JSON serialization
                let prevMessages = new Map<String, String>(); 

                MessageController.getRecentMessages(sessionToken).then((messages : Map<String, String>) => {
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

        socket.on("newGame", (characters) => {
            RoomController.createRoom(socket.decoded["userToken"]).then((sessionToken) => { 
                if(sessionToken == "") {
                    console.log("Could not create a new room");
                    return;
                }
                socket.join(sessionToken);
                DungeonMasterController.initStoryStreamed(characters, sessionToken, io.to(sessionToken));
                socket.emit("newGame", sessionToken);
            }).catch((err) => {
                console.log(err);
            });
        });
    });
}

export default socket;