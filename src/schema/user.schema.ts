/* eslint-disable import/prefer-default-export */
import {
	object, string, ref, array, date, boolean,
} from 'yup';

export const createUserSchema = object({
	body: object({
		firstName: string().required('First name is required'),
		lastName: string().required('Last name is required'),
		email: string()
			.email('Must be a valid email')
			.required('Email is required'),
		password: string()
			.required('Password is required')
			.min(6, 'Password is too short - Should be 6 characters minimum'),
		passwordConfirmation: string().oneOf(
			[ref('password'), null],
			'Passwords must match',
		),
		array: string(),
		friends: array(),
		friendRequests: array(),
		dateOfBirth: date(),
		mailingList: boolean(),
		profilePhoto: string(),
		bio: string(),
		jobTitle: string(),
		education: string(),
	}),
});

export const createUserSessionSchema = object({
	body: object({
		email: string()
			.email('Must be a valid email')
			.required('Email is required'),
		password: string()
			.required('Password is required')
			.min(6, 'Password is too short - Should be 6 characters minimum')
			.matches(/^[a-zA-Z0-9_.-]*$/, 'Password can only contain Latin letters'),
	}),
});
