import { get } from 'lodash';
import { Request, Response, NextFunction } from 'express';

const requiresUser = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const user = get(req, 'user');
	console.log(user, 'user in requires user');
	if (!user) {
		return res.status(401).json({ msg: 'Unable to send request' });
	}
	return next();
};

export default requiresUser;
