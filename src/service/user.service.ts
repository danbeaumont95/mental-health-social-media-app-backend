/* eslint-disable no-underscore-dangle */
import { omit } from 'lodash';
import aws from 'aws-sdk';
import {
	DocumentDefinition, FilterQuery, QueryOptions, UpdateQuery,
} from 'mongoose';
import User, { UserDocument } from '../model/User';
import Post from '../model/Post';

export async function createUser(input:DocumentDefinition<UserDocument>) {
	try {
		const user = await User.create(input);
		if (!user) {
			console.log('no user found');
		}
		return user;
	} catch (error) {
		return error;
	}
}

export async function findUser(query: FilterQuery<UserDocument>) {
	return User.findOne(query).lean();
}

export async function validatePassword({
	email,
	password,
}: {
    email: UserDocument['email'];
    password: string;
}) {
	const user = await User.findOne({ email });
	if (!user) {
		return false;
	}
	const isValid = await user.comparePassword(password);
	if (!isValid) {
		return false;
	}
	return omit(user.toJSON(), 'password');
}

export async function getAllUsers() {
	try {
		return await User.find({});
	} catch (error) {
		throw new Error(error);
	}
}

// eslint-disable-next-line max-len
export async function getUser(query: FilterQuery<UserDocument>, options: QueryOptions = { lean: true }) {
	try {
		const user = await User.findOne(query, {}, options);
		return user;
	} catch (error) {
		console.log(error, 'err in catch');
	}
}

// eslint-disable-next-line max-len
export async function postFriendRequest(query: FilterQuery<UserDocument>, options: UpdateQuery<{_id, firstName, lastName}>) {
	const { _id, firstName, lastName } = options;
	const obj = { _id, firstName, lastName };
	const userSentTo = await User.findByIdAndUpdate(query, { friendRequests: [obj] });

	if (!userSentTo) {
		throw new Error('[BadRequest] Couldn\'t find user');
	}
	return userSentTo;
}

// eslint-disable-next-line max-len
export async function acceptFriendRequest(query: FilterQuery<UserDocument>, options: UpdateQuery<{_id, firstName, lastName}>) {
	const friendDetails = await User.findById(query);

	const {
		_id, firstName, lastName, profilePhoto,
	} = friendDetails;
	const addToFriends = {
		_id, firstName, lastName, profilePhoto,
	};

	// eslint-disable-next-line max-len
	const updatedUser = await User.findByIdAndUpdate(options._id, { $push: { friends: [addToFriends] }, $pull: { friendRequests: { _id: query } } });

	const friendId = updatedUser._id;
	const friendFirstName = updatedUser.firstName;
	const friendLastName = updatedUser.lastName;
	const friendPhoto = updatedUser.profilePhoto;

	// eslint-disable-next-line max-len
	await User.findByIdAndUpdate(query, {
		$push: {
			friends: {
				_id: friendId, firstName: friendFirstName, lastName: friendLastName, friendPhoto,
			},
		},
	});
	return updatedUser;
}

export async function updateUserProfilePhoto(query: FilterQuery<UserDocument>,
	data: aws.S3.ManagedUpload.SendData) {
	const { _id } = query;
	const { Location } = data;

	const newUser = await User.findByIdAndUpdate({ _id }, {
		$set: {
			profilePhoto: Location,
		},
	}, {
		new: true,
	}).lean();

	return newUser;
}

export async function postEmotion(query: FilterQuery<UserDocument>, emotion) {
	const { _id } = query;
	const user = await User.findByIdAndUpdate({ _id }, {
		$push: {
			emotion: {
				emotion,
				createdAt: new Date().toISOString(),
			},
		},
	}, { new: true });
	return user;
}

// Change likes to array
export async function addLike(query: FilterQuery<UserDocument>, postId) {
	try {
		const { _id } = query;

		const user = await getUser({ _id });
		const { firstName, lastName } = user;

		const post = await Post.findByIdAndUpdate({ _id: postId }, {
			$push: {
				likes: {
					userFirstName: firstName, userLastName: lastName, userId: _id,
				},
			},
		}, { new: true });
		if (!post) {
			console.log('canot find post');
		}

		return post;
	} catch (error) {
		console.log(error, 'error in catch');
	}
}

export async function deleteLike(query: FilterQuery<UserDocument>, postId) {
	try {
		const { _id } = query;

		const post = await Post.findByIdAndUpdate({ _id: postId }, {
			$pull: {
				likes: {
					userId: _id,
				},
			},
		}, { new: true });

		if (!post) {
			console.log('canot find post');
		}
		return post;
	} catch (error) {
		console.log(error, 'error in catch');
	}
}

export async function updateProfile(query: FilterQuery<UserDocument>, body) {
	const { _id } = query;

	const {
		bio, education, jobTitle,
	} = body;
	let user;
	if (bio) {
		user = await User.findByIdAndUpdate({ _id }, {
			$set: {
				bio,
			},

		}, { new: true });
	}
	if (education) {
		user = await User.findByIdAndUpdate({ _id }, {
			$set: {
				education,
			},
		}, { new: true });
	}
	if (jobTitle) {
		user = await User.findByIdAndUpdate({ _id }, {
			$set: {
				jobTitle,
			},
		}, { new: true });
	}
	return user;
}

export async function getMyFriends(query: FilterQuery<UserDocument>) {
	const { _id } = query;
	const user = await User.findById({ _id }).select('friends');
	const { friends } = user;

	return friends;
}
