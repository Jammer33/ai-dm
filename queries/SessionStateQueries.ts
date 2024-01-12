import SessionState from "../db_models/sessionState";

class SessionStateQueries {
    constructor() {}

    async findSessionStateBySessionToken(sessionToken: string): Promise<SessionState | null> {
        const sessionState = await SessionState.findOne({
            where: {
                sessionToken: sessionToken,
            },
        });

        return sessionState;
    }
}

export default new SessionStateQueries();
