
// TO BE IMPLEMENTED
class RoomService {
    async joinRoom(sessionToken : string) {

    }

    async leaveRoom(sessionToken : string) {

    }

    findNumberOfPlayersInRoom(sessionToken : string) {
        // will be used to determine if the DM should be triggered
        // will be found from the our information stored in the database on session initiation
        return 1;
    }
}

export default new RoomService();