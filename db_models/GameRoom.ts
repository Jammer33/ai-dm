import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from "sequelize-typescript";

@Table
class Room extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    sessionToken!: Number;

    @Column(DataType.STRING)
    playerId!: Number;
}

export default Room;
