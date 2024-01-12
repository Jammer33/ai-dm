import { AccountStatus } from "../models/General";
import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table
class User extends Model {
    @Column(DataType.STRING)
    userToken!: string;

    @Column(DataType.STRING)
    username!: string;

    @Column(DataType.STRING)
    email!: string;

    @Column(DataType.STRING)
    password!: string;

    @Column(DataType.BOOLEAN)
    isEmailVerified!: boolean;

    @Column(DataType.ENUM('ACTIVE', 'INACTIVE', 'DELETED'))
    accountStatus!: AccountStatus;

    @Column(DataType.DATE)
    lastLoginAt!: Date;
}

export default User;
