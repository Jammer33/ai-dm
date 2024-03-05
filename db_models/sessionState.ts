import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table
class SessionState extends Model {
    @Column(DataType.STRING)
    s3Id!: string;

    @Column(DataType.STRING)
    campaignToken!: string;
}

export default SessionState;
