import mongoose from 'mongoose';
import { UserDocument } from './User';

export interface PostDocument extends mongoose.Document {
    user: UserDocument['_id'];
    body: string;
    emotion: string;
    createdAt: Date;
    updatedAt: Date;
    likes: Array<object>;
    comments: Array<object>;
    private: boolean;
}

const PostSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	body: { type: String, default: true },
	likes: { type: Array, default: [] },
	comments: { type: Array, default: [] },
	private: { type: Boolean, default: false },
	emotion: { type: String, default: '' },
}, {
	timestamps: true,
});

const Post = mongoose.model<PostDocument>('Post', PostSchema);

export default Post;
