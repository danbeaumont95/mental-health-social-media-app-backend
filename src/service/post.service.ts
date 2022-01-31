import {
	DocumentDefinition,
	FilterQuery,
} from 'mongoose';

import Post, { PostDocument } from '../model/Post';
import { getUser } from './user.service';

// eslint-disable-next-line import/prefer-default-export
export async function createPost(input: DocumentDefinition<PostDocument>) {
	try {
		const post = await Post.create(input);
		if (!post) {
			console.log(post, 'post not found');
		}
		return post;
	} catch (error) {
		throw new Error(error);
	}
}

export async function getAllPosts() {
	try {
		return await Post.find({});
	} catch (error) {
		throw new Error(error);
	}
}

// eslint-disable-next-line max-len
export async function deletePostById(query:FilterQuery<PostDocument>) {
	try {
		const post = await Post.findByIdAndDelete(query, {});
		return post;
	} catch (error) {
		console.log(error, 'erorororor');
	}
}

export async function getPostById(query: FilterQuery<PostDocument>) {
	const post = await Post.findById(query, {});
	return post;
}

export async function addComment(query:FilterQuery<PostDocument>, postId, comment) {
	try {
		const { _id } = query;
		const user = await getUser({ _id });
		const { firstName, lastName } = user;

		const post = await Post.findByIdAndUpdate({ _id: postId }, {
			$push: {
				comments: {
					userName: `${firstName} ${lastName}`,
					userId: _id,
					comment,
					commentTime: new Date().toISOString(),
				},
			},
		}, { new: true });

		return post;
	} catch (error) {
		console.log('error in catch');
	}
}

export async function deleteComment(query: FilterQuery<PostDocument>, postId) {
	try {
		const { _id } = query;

		const post = await Post.findByIdAndUpdate({ _id: postId }, {
			$pull: {
				comments: {
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

export async function getMyPosts(query) {
	try {
		const { _id: userId } = query;
		const posts = await Post.find({ user: userId });
		return posts;
	} catch (error) {
		throw new Error(error);
	}
}

export async function getUsersPosts(query) {
	try {
		const posts = await Post.find({ user: query, private: false });
		return posts;
	} catch (error) {
		throw new Error(error);
	}
}
