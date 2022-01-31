import { LeanDocument, FilterQuery, UpdateQuery } from 'mongoose';
import config from 'config';
import { get } from 'lodash';
import Session, { SessionDocument } from '../model/Session';
import { UserDocument } from '../model/User';
import { signJwt, decode } from '../utils/jwt.utils';
import { findUser } from './user.service';
import User from '../model/Session';

export async function createSession(userId: string, userAgent: string) {
	const session = await Session.create({ user: userId, userAgent });
	return session.toJSON();
}

export function createAccessToken({
	user,
	session,
}: {
    user:
    | Omit<UserDocument, 'password'>
    | LeanDocument<Omit<UserDocument, 'password'>>;
    session:
    | Omit<SessionDocument, 'password'>
    | LeanDocument<Omit<SessionDocument, 'password'>>;
}) {
	// Build and return the new access token
	const accessToken = signJwt(
		// eslint-disable-next-line no-underscore-dangle
		{ ...user, session: session._id },
		{ expiresIn: config.get('accessTokenTtl') }, // 15 minutes
	);

	return accessToken;
}

export async function reIssueAccessToken({
	refreshToken,
}: {
    refreshToken: string;
}) {
	// Decode the refresh token
	const { decoded } = decode(refreshToken);

	if (!decoded || !get(decoded, '_id')) return false;

	// Get the session
	const { session: sessiondId } = decoded;

	const session = await Session.findById({ _id: sessiondId }); // new wat

	// Make sure the session is still valid
	if (!session || !session?.valid) return false;

	const user = await findUser({ _id: session.user });
	if (!user) return false;

	const accessToken = createAccessToken({ user, session });
	return accessToken;
}

// eslint-disable-next-line max-len
export async function updateSession(query: FilterQuery<SessionDocument>, update: UpdateQuery<SessionDocument>) {
	return Session.updateOne(query, update);
}

export async function findSessions(query: FilterQuery<SessionDocument>) {
	return Session.find(query).lean();
}
