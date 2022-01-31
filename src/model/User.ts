/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from 'config';

export interface UserDocument extends mongoose.Document {
	_id: string;
  email: string;
  firstName: string;
	lastName: string;
	emotion: Array<object>;
	friends: Array<object>;
  password: string;
  createdAt: Date;
  updatedAt: Date;
	friendRequests: Array<object>;
	dateOfBirth: Date;
	mailingList: Boolean;
	profilePhoto: string;
  bio: string;
  jobTitle: string;
  education: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true },
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		password: { type: String, required: true },
		emotion: {
			type: Array,
			required: false,
			default: [
				{ emotion: '', createdAt: new Date().toISOString() },
			],
		},
		friends: { type: Array, required: true, default: [] },
		friendRequests: { type: Array, required: false, default: [] },
		dateOfBirth: { type: Date, required: true },
		mailingList: { type: Boolean, required: true },
		profilePhoto: { type: String, default: '' },
		bio: { type: String, default: '' },
		jobTitle: { type: String, default: '' },
		education: { type: String, default: '' },
	},
	{
		timestamps: true,
	},
);

userSchema.pre('save', async function (next) {
	const user = this as UserDocument;

	if (!user.isModified('password')) {
		return next();
	}

	const salt = await bcrypt.genSalt(config.get<number>('saltWorkFactor'));

	const hash = await bcrypt.hashSync(user.password, salt);

	user.password = hash;

	return next();
});

userSchema.methods.comparePassword = async function (
	candidatePassword: string,
): Promise<boolean> {
	const user = this as UserDocument;

	return bcrypt.compare(candidatePassword, user.password).catch((e) => false);
};

const UserModel = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;
