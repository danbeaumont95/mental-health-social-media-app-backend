/* eslint-disable no-underscore-dangle */
import { Request, Response } from 'express';
import config from 'config';
import { get } from 'lodash';
import {
	createSession,
	findSessions,
	updateSession,
	reIssueAccessToken,
} from '../service/session.service';
import { validatePassword } from '../service/user.service';
import { signJwt, decode } from '../utils/jwt.utils';

export async function createUserSessionHandler(req: Request, res: Response) {
	const respBody = {
		success: false,
		message: '',
		data: {},
	};
	// Validate the user's password
	const user = await validatePassword(req.body);

	if (!user) {
		respBody.message = 'Invalid email or password';
		return res.status(200).json(respBody);
	}

	// create a session

	const session = await createSession(user._id, req.get('user-agent') || '');

	// create an access token

	const accessToken = signJwt(
		{ ...user, session: session._id },
		{ expiresIn: config.get('accessTokenTtl') }, // 15 minutes
	);

	// create a refresh token
	const refreshToken = signJwt(
		{ ...user, session: session._id },
		{ expiresIn: config.get('refreshTokenTtl') }, // 1 year
	);

	// return access & refresh tokens
	const { _id } = user;

	respBody.success = true;
	respBody.data = { accessToken, refreshToken, _id };
	return res.status(200).json(respBody);
}

export async function getUserSessionsHandler(req: Request, res: Response) {
	const userId = res.locals.user._id;
	const sessions = await findSessions({ user: userId, valid: true });

	return res.send(sessions);
}

export async function deleteSessionHandler(req: Request, res: Response) {
	const sessionId = res.locals.user.session;

	await updateSession({ _id: sessionId }, { valid: false });

	return res.send({
		accessToken: null,
		refreshToken: null,
	});
}

export async function refreshTokenHandler(req: Request, res: Response) {
	const accessToken = get(req, 'headers.authorization', '').replace(
		/^Bearer\s/,
		'',
	);

	const refreshToken = get(req, 'headers.x-refresh');

	if (!accessToken) return res.status(401).json({ msg: 'no access token found' });
	const { decoded, expired } = decode(accessToken);
	if (decoded) {
		// @ts-ignore
		req.user = decoded;
	}
	if (expired && refreshToken) {
		const newAccessToken = await reIssueAccessToken({ refreshToken });

		if (newAccessToken) {
			res.setHeader('x-access-token', newAccessToken);
			// eslint-disable-next-line no-shadow
			const { decoded } = decode(accessToken);
			// @ts-ignore
			req.user = decoded;
			return res.status(200).json({ newAccessToken });
		}
	} else {
		return res.status(200).json([]);
	}
}
