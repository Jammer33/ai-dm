import { Server } from "socket.io";
import DungeonMasterController from "../controllers/DungeonMasterController";
import MessageController from "../controllers/MessageController";
import { SocketErrorHandler } from "../middleware/ErrorHandler";
import socketAuth from "../middleware/SocketAuth";
import RoomController from "../controllers/RoomController";

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
            // infer the player's identity from the cookie that they are passing in
            MessageController.storeMessageAndActivateDM(sessionToken, socket.decoded["userToken"], message, io.to(sessionToken));
        });

        socket.on("joinGame", async (sessionToken) => {
            /* - join the session room
            - broadcast joining
            - receive the most recent DM message and any subsequent player messages
            - save the data in the session table (for retrieval if needed in future)
            */
           socket.join(sessionToken);
        });

        socket.on("newGame", (characters) => {
            // find unused session token, return the session token
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