import * as mongoose from 'mongoose';

export type UserModel = mongoose.Document & {
    deviceId: string,
    name: { type: string, unique: true, index: true },
    account: string,
    logoUrl: string,
    lastSeen: Date,
    hits: [
        { date: string, number: number }
    ]
};

const userSchema = new mongoose.Schema({
    deviceId: String,
    name: { type: String, unique: true, index: true },
    account: String,
    logoUrl: String,
    lastSeen: Date,
    hits: [
        { date: String, number: Number }
    ]
},                                     { timestamps: true });

const user = mongoose.model('User', userSchema);
export default user;