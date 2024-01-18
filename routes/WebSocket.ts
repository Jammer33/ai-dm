import { Server } from "socket.io";
import DungeonMasterController from "../controllers/DungeonMasterController";
import MessageController from "../controllers/MessageController";
import { SocketErrorHandler } from "../middleware/ErrorHandler";
import socketAuth from "../middleware/SocketAuth";
import Memory from "../db_models/memories";
import UserQueries from "../queries/UserQueries";

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
            MessageController.storeMessageAndActivateDM(sessionToken, socket.decoded["userToken"], message, socket);
        });

        socket.on("newGame", (characters, sessionToken) => {
            console.log("sessionToken: " + sessionToken);
            DungeonMasterController.initStoryStreamed(characters, sessionToken, socket);
        });
    });
}

export default socket;