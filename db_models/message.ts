import { Table, Column, Model, DataType, Index, BelongsTo } from "sequelize-typescript";
import RoomToPlayer from "./RoomPlayer";

@Table({
    updatedAt: false,
    indexes: [
        {
            fields: ["campaign_token", "user_token", "created_at"],
        },
    ],
})
class Message extends Model {
    @Column(DataType.STRING)
    campaignToken!: string;

    @Column(DataType.STRING)
    userToken!: string;

    @Column(DataType.STRING(4000))
    content!: string;

    @BelongsTo(() => RoomToPlayer, 'campaignToken')
    roomToPlayer!: RoomToPlayer;
}

export default Message;
