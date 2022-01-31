import {
	array, object, string, boolean,
} from 'yup';

const payload = {
	body: object({
		body: string().required('Body is required')
			.min(3, 'Body is too short - Should be 3 characters minimum'),
		likes: array(),
		comments: array(),
		private: boolean(),
		emotion: string(),
	}),
};

// eslint-disable-next-line import/prefer-default-export
export const createPostSchema = object({
	...payload,
});

export const deletePostSchema = object({
	...payload,
});
