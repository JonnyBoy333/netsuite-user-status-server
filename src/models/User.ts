import * as mongoose from 'mongoose';

export type UserModel = mongoose.Document & {
    name: { type: string, unique: true, index: true },
    account: string,
    logo: string,
    lastSeen: Date,
};

const userSchema = new mongoose.Schema({
    name: { type: String, unique: true, index: true },
    account: String,
    logo: String,
    lastSeen: Date
},                                     { timestamps: true });

const user = mongoose.model('User', userSchema);
export default user;