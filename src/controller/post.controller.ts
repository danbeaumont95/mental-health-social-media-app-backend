/* eslint-disable no-underscore-dangle */
import { Request, Response } from 'express';
import { get } from 'lodash';
import _ from 'underscore';
import log from '../logger';
import {
	createPost, getAllPosts, deletePostById, addComment, deleteComment, getPostById, getMyPosts, getUsersPosts,
} from '../service/post.service';

export interface Body {
  body: string
  emotion: string;
  private: boolean;
}

const emotionChecker = (body: Body): boolean => {
	const { emotion } = body;

	if (emotion !== 'Excited' && emotion !== 'Sad' && emotion !== 'Happy'
  && emotion !== 'Interested' && emotion !== 'Angry') {
		return false;
	}
	return true;
};

// eslint-disable-next-line import/prefer-default-export
export async function createPostHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	const userId = get(req, 'user._id');

	const { body } = req;

	if (!body.body.length) {
		respBody.message = 'Body must not be empty';
		return res.status(200).json(respBody);
	}
	if (!body.emotion || !body.emotion.length) {
		respBody.message = 'Emotion must not be empty';
		return res.status(200).json(respBody);
	}

	const emotion = emotionChecker(body);

	const post = await createPost({ ...body, user: userId });
	respBody.success = true;
	respBody.data = post;
	return res.status(200).json(respBody);
}

export async function getAllPostsHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	const posts = await getAllPosts();
	if (!posts || !posts.length) {
		respBody.message = 'No posts found';
		return res.status(200).json(respBody);
	}
	respBody.success = true;
	respBody.data = posts;
	return res.status(200).send(respBody);
}

export async function deletePostHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const postId = get(req, 'params.id');
		const post = await deletePostById(postId);
		if (!post) {
			respBody.message = 'No post found';
			return res.status(200).json(respBody);
		}

		respBody.success = true;
		respBody.message = 'post deleted';
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
}

export async function getPostHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const postId = get(req, 'params.id');
		const post = await getPostById(postId);
		if (!post) {
			respBody.message = 'No post found';

			return res.status(200).json(respBody);
		}
		respBody.success = true;
		respBody.data = post;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
}

const changeObjIdToId = (str) => {
	const a = JSON.stringify(str);
	const firstQuote = a.indexOf('"') + 1;
	const lastQuote = a.lastIndexOf('"');
	const sub = a.substring(firstQuote, lastQuote);
	return sub;
};

const sortByCreatedAt = (arr) => _.sortBy(arr, 'createdAt').reverse();

const onlyNonPrivateUnlessUserisPostedUser = (arr, user) => {
	const filter = arr.filter((el) => (el.private && (el.user == user)) || !el.private);
	return filter;
};

//  Move logic to service
export async function getMostRecentPostsHanlder(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');

		const { friends } = user;

		const friendsIds = friends.map((el) => el._id);

		friendsIds.push(user._id);

		const posts = await getAllPosts();

		const friendsPosts = posts.map((el) => {
			const idsMap = friendsIds.map((f) => {
				if (changeObjIdToId(el.user) === f) {
					return el;
				}
			}).filter((a) => a !== undefined);
			return idsMap;
		});

		const friendsPostsNoEmptyArrays = friendsPosts.filter((v) => Object.keys(v).length !== 0);
		if (!friendsPostsNoEmptyArrays.length) {
			respBody.message = 'No posts found';
			return res.status(200).json(respBody);
		}

		const flattendPosts = friendsPostsNoEmptyArrays.flat(1);
		const nonPrivateUnlessItsUser = onlyNonPrivateUnlessUserisPostedUser(flattendPosts, user._id);
		const mostRecentPosts = sortByCreatedAt(nonPrivateUnlessItsUser);
		respBody.success = true;
		respBody.data = mostRecentPosts;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
}

export async function addCommentHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');
		const postId = get(req, 'params.post_id');
		const body = get(req, 'body');
		const { comment } = body;

		const updatedPost = await addComment(user, postId, comment);

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
}

export async function deleteCommentHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');
		const postId = get(req, 'params.post_id');
		const updatedPost = await deleteComment(user, postId);
		if (!updatedPost) {
			respBody.message = 'No post found';
			return res.status(200).json(respBody);
		}
		respBody.message = '[Success] Comment deleted on post';
		respBody.success = true;
		respBody.data = updatedPost;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
}

export async function getMyPostsHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const user = get(req, 'user');

		const posts = await getMyPosts(user);
		if (!posts || !posts.length) {
			respBody.message = 'No posts found';
			return res.status(200).send(respBody);
		}
		respBody.success = true;
		respBody.data = posts;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
}

export async function getUserPostsHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	try {
		const userId = get(req, 'params.id');
		const posts = await getUsersPosts(userId);
		if (!posts.length) {
			respBody.success = true;
			respBody.message = 'No posts found by user';
			return res.status(200).send(respBody);
		}
		if (!posts) {
			respBody.message = 'Error retrieving posts';
			return res.status(400).send(respBody);
		}
		respBody.success = true;
		respBody.data = posts;
	} catch (error) {
		log.error(error);
		return res.status(400).send(error.message);
	}
	return res.status(200).json(respBody);
}
