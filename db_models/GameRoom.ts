import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Default } from "sequelize-typescript";

@Table
class Room extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    sessionToken!: Number;

    @Default("")
    @Column(DataType.STRING)
    description!: String;

    @Default("")
    @Column(DataType.STRING)
    name!: String;
}

export default Room;