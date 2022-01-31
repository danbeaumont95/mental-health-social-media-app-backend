/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { omit, get, uniqueId } from 'lodash';
import config from 'config';
import aws from 'aws-sdk';
import multiparty from 'multiparty';
import fs from 'fs';
import moment from 'moment';
import log from '../logger';
import {
	createUser,
	getAllUsers,
	getUser,
	postFriendRequest,
	acceptFriendRequest,
	updateUserProfilePhoto,
	postEmotion,
	addLike,
	deleteLike,
	updateProfile,
	getMyFriends,
} from '../service/user.service';
import { getMyPosts } from '../service/post.service';

const S3_BUCKET_NAME = config.get('S3_BUCKET_NAME') as string;
const S3_REGION = config.get('S3_REGION') as string;
const AWS_ACCESS_KEY_ID = config.get('AWS_ACCESS_KEY_ID') as string;
const AWS_SECRET_ACCESS_KEY = config.get('AWS_SECRET_ACCESS_KEY') as string;
const S3_ACCESS_KEY = config.get('S3_ACCESS_KEY') as string;
const S3_ACCESS_SECRET = config.get('S3_ACCESS_SECRET') as string;

export async function createUserHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = await createUser(req.body);

		if (!user) {
			respBody.message = '[BadRequest] Invalid Input';
		}

		respBody.success = true;
		respBody.data = omit(user.toJSON(), 'password');
	} catch (error) {
		return res.send({ error: error.message });
	}
	return res.status(200).json(respBody);
}

export async function getAllUsersHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const users = await getAllUsers();
		if (!users) {
			respBody.message = 'No users found';
		}
		respBody.success = true;
		respBody.data = users;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
}

export const getUserHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const userId = get(req, 'params.id');
		const user = await getUser({ _id: userId });

		if (!user) {
			respBody.message = 'No user found';
			return res.status(200).json(respBody);
		}
		respBody.success = true;
		respBody.data = user;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const getUserByEmailHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const userEmail = get(req, 'params.email');
		const user = await getUser({ email: userEmail });
		if (!user) {
			respBody.message = 'No user found with that email';
			return res.status(200).json(respBody);
		}
		respBody.success = true;
		respBody.data = user;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const postFriendRequestHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const userThatsSending = get(req, 'user');
		const friendId = get(req, 'params.friend_id');
		const request = await postFriendRequest(friendId, userThatsSending);
		if (!request) {
			respBody.message = 'Error sending request';
			return res.status(200).json(respBody);
		}
		respBody.success = true;
		respBody.message = 'Friend request sent';
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const acceptFriendRequestHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');
		const friendId = get(req, 'params.friend_id');
		const request = await acceptFriendRequest(friendId, user);
		if (!request) {
			respBody.message = 'Error accepting request';
			return res.status(200).json(respBody);
		}

		respBody.success = true;
		respBody.message = 'Friend request accepted';
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

const s3 = new aws.S3({
	accessKeyId: S3_ACCESS_KEY,
	secretAccessKey: S3_ACCESS_SECRET,
	region: S3_REGION,
});

const upload = (buffer, name) => {
	const params = {
		ACL: 'public-read',
		Body: buffer,
		Bucket: S3_BUCKET_NAME,
		Key: `${name}`,
	};

	return s3.upload(params).promise();
};

const generateSuffix = (type) => {
	switch (type) {
		case 'image/jpeg':
			return 'jpg';
		case 'image/png':
			return 'png';
		default:
			return '';
	}
};

export const uploadProfilePhoto = async (req: Request, res: Response) => {
	const form: multiparty.Form = new multiparty.Form();

	const respBody = {
		success: false,
		message: '',
		data: {},
	};

	const user = get(req, 'user');
	try {
		form.parse(req, async (error, fields, files) => {
			if (error) {
				return res.status(500).send(error);
			}
			try {
				const { path } = files.file[0];
				const buffer = fs.readFileSync(path);
				const uuid = uniqueId();
				const suffix = generateSuffix(files.file[0].headers['content-type']);
				const fileName = `users/${user._id}/profilePhoto_${uuid}.${suffix}`;

				const data = await upload(buffer, fileName);
				const updatedUser = await updateUserProfilePhoto(user, data);
				respBody.success = true;
				respBody.data = updatedUser;

				return res.status(200).json(respBody);
			} catch (e) {
				return res.status(500).send({ error: e.message, e });
			}
		});
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
};

export const addEmotionHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');
		const { emotion } = req.body;

		const updatedUser = await postEmotion(user, emotion);

		respBody.success = true;
		respBody.data = updatedUser;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const addLikeHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');
		const postId = get(req, 'params.post_id');
		const updatedPost = await addLike(user, postId);

		if (!updatedPost) {
			respBody.message = 'No post found';
			return res.status(200).json(respBody);
		}
		respBody.success = true;
		respBody.data = updatedPost;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const deleteLikeHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');
		const postId = get(req, 'params.post_id');
		const updatedPost = await deleteLike(user, postId);

		if (!updatedPost) {
			respBody.message = 'No post found';
			return res.status(200).json(respBody);
		}
		respBody.message = 'Like removed from post';
		respBody.success = true;
		respBody.data = updatedPost;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const updateProfileHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');
		const { body } = req;
		const updatedUser = await updateProfile(user, body);
		if (!updatedUser) {
			respBody.message = 'Error updating user';
			return res.status(200).json(respBody);
		}
		respBody.success = true;
		respBody.data = updatedUser;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

const testIfDatesInBetweenDates = (now, dateFrom, date) => {
	const input = moment(date);
	const isIt = input.isBetween(dateFrom, now);

	return isIt;
};

const getEmotionsInTimeFrame = (posts, now, dateFrom) => {
	const emotions = posts.map((el) => (
		testIfDatesInBetweenDates(now, dateFrom, el.createdAt) ? el.emotion : null))
		.filter((el) => el !== null);
	return emotions;
};

export const getWeeklyEmotionHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');

		const posts = await getMyPosts(user);

		const now = moment();

		const dateFrom = moment().subtract(7, 'd');

		const emotionsInPastWeek = getEmotionsInTimeFrame(posts, now, dateFrom);

		if (emotionsInPastWeek.length === 0) {
			respBody.message = 'No posts found with emotions attached this week';
			return res.status(200).json(respBody);
		}

		const today = moment(now).format('DD/MM/YYYY');
		const weekAgo = moment(dateFrom).format('DD/MM/YYYY');

		respBody.success = true;
		respBody.data = {
			emotionsInPastWeek,
			today,
			weekAgo,
		};
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const getMonthlyEmotionHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');

		const posts = await getMyPosts(user);

		const now = moment();

		const dateFrom = moment().subtract(1, 'month');

		const emotionsInPastMonth = getEmotionsInTimeFrame(posts, now, dateFrom);

		if (emotionsInPastMonth.length === 0) {
			respBody.message = 'No posts found with emotions attached this month';
			return res.status(200).json(respBody);
		}

		const today = moment(now).format('DD/MM/YYYY');
		const monthAgo = moment(dateFrom).format('DD/MM/YYYY');

		respBody.success = true;
		respBody.data = {
			emotionsInPastMonth,
			today,
			monthAgo,
		};
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
};

export const getFriendsHandler = async (req: Request, res: Response) => {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	const user = get(req, 'user');
	const myFriends = await getMyFriends(user);

	if (!myFriends) {
		respBody.message = '[BadRequest] Error retrieving friends';
		return res.status(200).json(respBody);
	}
	if (!myFriends.length) {
		respBody.message = 'No friends added';
		respBody.success = true;
		return res.status(200).json(respBody);
	}
	respBody.success = true;
	respBody.data = { friends: myFriends };
	return res.status(200).json(respBody);
};
