import { Sequelize } from "sequelize-typescript";
import User from "./user";
import SessionState from "./sessionState";
import Memory from "./memories";
import Room from "./GameRoom";
import RoomToPlayer from "./RoomPlayer";

const sequelize = new Sequelize({
    database: process.env.AWS_RDS_DB_NAME,
    dialect: 'mysql',
    username: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASS,
    host: process.env.AWS_RDS_HOST,
    models: [__dirname + '/db_models'],
    define: {
        underscored: true,
    },

});

sequelize.addModels([User, SessionState, Memory, RoomToPlayer, Room]);

if (process.env.NODE_ENV === 'dev') {
    sequelize.sync({ alter: true });
}

export { sequelize, Sequelize, User };