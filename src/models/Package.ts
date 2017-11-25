import * as mongoose from 'mongoose';

export type PackageModel = mongoose.Document & {
    active: { type: Boolean, default: true },
    address: string,
    unit: string,
    accessCode: string,
    qrImage: string,
    lockerLocation: string,
    labelPicture: string,
    pickedUp: boolean
};

const packageSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    address: String,
    unit: String,
    accessCode: String,
    qrImage: String,
    lockerLocation: String,
    labelPicture: String,
    pickedUp: { type: Boolean, default: false }
},                                        { timestamps: true });

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const luxerPackage = mongoose.model('Package', packageSchema);
export default luxerPackage;