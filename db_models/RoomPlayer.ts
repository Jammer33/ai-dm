import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, Default } from "sequelize-typescript";
import { RoomState } from "../models/General";

@Table
class RoomToPlayer extends Model {
    @PrimaryKey
    @Column(DataType.INTEGER)
    sessionToken!: Number;

    @PrimaryKey
    @Column(DataType.STRING)
    playerId!: Number;

    @Default(RoomState.INACTIVE)
    @Column(DataType.ENUM('ACTIVE', 'INACTIVE'))
    state!: RoomState;
}

export default RoomToPlayer;

