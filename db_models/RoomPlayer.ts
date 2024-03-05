import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, Default } from "sequelize-typescript";
import { RoomState } from "../models/General";

@Table
class RoomToPlayer extends Model {
    @PrimaryKey
    @Column(DataType.STRING)
    campaignToken!: String;

    @PrimaryKey
    @Column(DataType.STRING)
    playerToken!: String;

    @Default(RoomState.INACTIVE)
    @Column(DataType.ENUM('ACTIVE', 'INACTIVE'))
    state!: RoomState;
}

export default RoomToPlayer;

