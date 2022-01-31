import { Express, Request, Response } from 'express';
import { validateRequest, requiresUser, deserializedUser } from './middleware';
import { createUserSchema, createUserSessionSchema } from './schema/user.schema';
import { createPostSchema } from './schema/post.schema';
import {
	createPostHandler,
	getAllPostsHandler,
	deletePostHandler,
	getMostRecentPostsHanlder,
	addCommentHandler,
	deleteCommentHandler,
	getPostHandler,
	getMyPostsHandler,
	getUserPostsHandler,
} from './controller/post.controller';
import { createUserSessionHandler, refreshTokenHandler } from './controller/session.controller';
import {
	createUserHandler,
	getAllUsersHandler,
	getUserHandler,
	postFriendRequestHandler,
	acceptFriendRequestHandler,
	uploadProfilePhoto,
	addEmotionHandler,
	addLikeHandler,
	deleteLikeHandler,
	getUserByEmailHandler,
	updateProfileHandler,
	getWeeklyEmotionHandler,
	getMonthlyEmotionHandler,
	getFriendsHandler,
} from './controller/user.controller';

export default function (app: Express) {
	app.get('/test', (req: Request, res: Response) => res.status(200).json({ msg: 'Hello' }));

	app.post('/api/users', validateRequest(createUserSchema), createUserHandler);

	app.get('/api/users', getAllUsersHandler);

	app.get('/api/users/:id', getUserHandler);

	app.get('/api/users/user/:email', getUserByEmailHandler);

	app.post('/api/users/sendFriendRequest/:friend_id', [requiresUser], postFriendRequestHandler);

	// eslint-disable-next-line max-len
	app.post('/api/users/acceptFriendRequest/:friend_id', [requiresUser], acceptFriendRequestHandler);

	app.post('/api/user/uploadPhoto', [requiresUser], uploadProfilePhoto);

	app.post('/api/user/addEmotion', [requiresUser], addEmotionHandler);

	app.patch('/api/user/addLike/:post_id', [requiresUser], addLikeHandler);

	app.delete('/api/user/deleteLike/:post_id', [requiresUser], deleteLikeHandler);

	app.post('/api/user/updateUser', [requiresUser], updateProfileHandler);

	app.get('/api/user/myWeeklyEmotions', [requiresUser], getWeeklyEmotionHandler);

	app.get('/api/user/myMonthlyEmotions', [requiresUser], getMonthlyEmotionHandler);

	app.get('/api/user/myFriends', [requiresUser], getFriendsHandler);

	app.post('/api/post/addComment/:post_id', [requiresUser], addCommentHandler);

	app.delete('/api/post/deleteComment/:post_id', [requiresUser], deleteCommentHandler);

	app.get('/api/post', getAllPostsHandler);

	app.post('/api/post', [requiresUser, validateRequest(createPostSchema)], createPostHandler);

	app.delete('/api/post/:id',
		[requiresUser], deletePostHandler);

	app.post('/api/session', validateRequest(createUserSessionSchema), createUserSessionHandler);

	app.get('/api/post/user/recent', [requiresUser], getMostRecentPostsHanlder);

	app.get('/api/post/:id', getPostHandler);

	app.get('/api/post/me/posts', [requiresUser], getMyPostsHandler);

	app.get('/api.post/user/:id', getUserPostsHandler);

	app.get('/api/session/refresh', refreshTokenHandler);

	app.get('/api/session/deserialize', deserializedUser);
}
