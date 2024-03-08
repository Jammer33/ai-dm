import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, Default } from "sequelize-typescript";
import { RoomState } from "../models/General";

@Table
class RoomToPlayer extends Model {
    @PrimaryKey
    @Column(DataType.STRING)
    campaignToken!: string;

    @PrimaryKey
    @Column(DataType.STRING)
    userToken!: string;

    @Default(RoomState.INACTIVE)
    @Column(DataType.ENUM('ACTIVE', 'INACTIVE'))
    state!: RoomState;

    @Column(DataType.STRING)
    characterName!: string;
}

export default RoomToPlayer;

