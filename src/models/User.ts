import * as mongoose from 'mongoose';

export type UserModel = mongoose.Document & {
    deviceId: { type: string, unique: true, index: true },
    name: { type: string, unique: true },
    account: string,
    logoUrl: string,
    lastSeen: Date,
};

const userSchema = new mongoose.Schema({
    deviceId: { type: String, unique: true, index: true },
    name: { type: String, unique: true },
    account: String,
    logoUrl: String,
    lastSeen: Date
},                                     { timestamps: true });

const user = mongoose.model('User', userSchema);
export default user;