import jwt from 'jsonwebtoken';
import config from 'config';

const privateKey = config.get('privateKey') as string;

const publicKey = config.get<string>('publicKey');

export function signJwt(object: Object, options?: jwt.SignOptions | undefined) {
	return jwt.sign(object, privateKey, options);
}

export function decode(token: string) {
	try {
		const decoded = jwt.verify(token, privateKey);
		return { valid: true, expired: false, decoded };
	} catch (error) {
		// eslint-disable-next-line no-return-assign
		return {
			valid: false,
			expired: error.message = 'JWT expired',
			decoded: null,
		};
	}
}

export function verifyJwt(token: string) {
	try {
		const decoded = jwt.verify(token, publicKey);
		return {
			valid: true,
			expired: false,
			decoded,
		};
	} catch (e: any) {
		console.error(e);
		return {
			valid: false,
			expired: e.message === 'jwt expired',
			decoded: null,
		};
	}
}
