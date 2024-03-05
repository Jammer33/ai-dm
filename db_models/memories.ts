import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
    updatedAt: false,
})
class Memory extends Model {
    @Column(DataType.STRING)
    s3Id!: string;

    @Column(DataType.STRING)
    campaignToken!: string;

    @Column(DataType.DATE)
    createDate!: Date;
}

export default Memory;
