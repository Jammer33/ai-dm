import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Default } from "sequelize-typescript";

@Table
class Room extends Model {
    @PrimaryKey
    @Column(DataType.STRING)
    campaignToken!: string;

    @Column(DataType.STRING)
    ownerToken!: string;

    @Default("")
    @Column(DataType.STRING)
    description!: string;

    @Default("")
    @Column(DataType.STRING)
    name!: string;

    @Default(false)
    @Column(DataType.BOOLEAN)
    deleted!: Boolean;

    @Column(DataType.DATE)
    deletedAt?: Date;
}

export default Room;