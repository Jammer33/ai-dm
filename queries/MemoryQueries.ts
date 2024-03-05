import Memory from "../db_models/memories";

class MemoryQueries {
    constructor() {}

    async findRecentMemoriesByCampaignToken(campaignToken: string, count: number = 3): Promise<Memory[]> {
        const memories = await Memory.findAll({
            where: {
                campaignToken: campaignToken,
            },
            limit: count,
            order: [["createDate", "DESC"]],
        });

        return memories;
    }

    async findAllMemoriesByCampaignToken(campaignToken: string): Promise<Memory[]> {
        const memories = await Memory.findAll({
            where: {
                campaignToken: campaignToken,
            },
            order: [["createDate", "DESC"]],
        });

        return memories;
    }
}

export default new MemoryQueries();