import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey } from "sequelize-typescript";
import Room from "./GameRoom";

@Table
class RoomToPlayer extends Model {
    @ForeignKey(() => Room)
    @PrimaryKey
    @Column(DataType.INTEGER)
    sessionToken!: Number;

    @PrimaryKey
    @Column(DataType.STRING)
    playerId!: Number;
}

export default RoomToPlayer;

