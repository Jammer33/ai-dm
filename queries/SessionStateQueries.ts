import SessionState from "../db_models/sessionState";

class SessionStateQueries {
    constructor() {}

    async findCampaignStateByCampaignToken(campaignToken: string): Promise<SessionState | null> {
        const campaignState = await SessionState.findOne({
            where: {
                campaignToken: campaignToken,
            },
        });

        return campaignState;
    }
}

export default new SessionStateQueries();
