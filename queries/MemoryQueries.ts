import Memory from "../db_models/memories";

class MemoryQueries {
    constructor() {}

    async findRecentMemoriesBySessionToken(sessionToken: string, count: number = 3): Promise<Memory[]> {
        const memories = await Memory.findAll({
            where: {
                sessionToken: sessionToken,
            },
            limit: count,
            order: [["createDate", "DESC"]],
        });

        return memories;
    }

    async findAllMemoriesBySessionToken(sessionToken: string): Promise<Memory[]> {
        const memories = await Memory.findAll({
            where: {
                sessionToken: sessionToken,
            },
            order: [["createDate", "DESC"]],
        });

        return memories;
    }
}

export default new MemoryQueries();