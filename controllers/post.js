const Post = require('../models/Post');
const User = require('../models/User');



// create a new post
exports.createPost = async (req, res) => {
    try {
        const newPostData = {
            caption: req.body.caption,
            image: {
                public_id: "req.body.public_id",
                url: "req.body.url",
            },
            owner: req.user._id,
        }
        const post = await Post.create(newPostData);
        const user = await User.findById(req.user._id);
        user.posts.push(post._id);
        await user.save();

        res.status(201).json({
            success: true,
            post,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


// Delete a post
exports.deletePost = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Post not found"
            });
        }
        if (post.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                error: "You are not authorized to delete this post"
            });
        }
        await post.remove();
        const user = await User.findById(req.user._id);
        const index = user.posts.indexOf(req.params.id);
        user.posts.splice(index, 1);
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Post deleted"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


// like and unlike a post
exports.likeAndUnlikePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Post not found"
            });
        }
        if (post.likes.includes(req.user._id)) {
            const index = post.likes.indexOf(req.user._id);
            post.likes.splice(index, 1);
            await post.save();
            return res.status(200).json({
                success: true,
                message: "Post unliked"
            });
        } else {
            post.likes.push(req.user._id);
            await post.save();
            return res.status(200).json({
                success: true,
                message: "Post liked"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


// get all posts of following users
exports.getPostOfFollowing = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);

        const posts = await Post.find({
            owner: {
                $in: user.following
            }
        });
        res.status(200).json({
            success: true,
            posts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


// update caption of a post
exports.updateCaption = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Post not found"
            });
        }
        if (post.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                error: "You are not authorized to update this post"
            });
        }
        post.caption = req.body.caption;
        await post.save();
        res.status(200).json({
            success: true,
            message: "Post updated"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


// comment on a post
exports.commentOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Post not found"
            });
        }

        // check if user has already commented on this post
        let commentIndex = -1;
        post.comments.forEach((comment, index) => {
            if (comment.user.toString() === req.user._id.toString()) {
                commentIndex = index;
            }
        });

        if (commentIndex !== -1) {
            post.comments[commentIndex].comment = req.body.comment;
            await post.save();
            res.status(200).json({
                success: true,
                message: "Comment Updated"
            });
        } else {
            const newComment = {
                user: req.user._id,
                comment: req.body.comment,
            }
            post.comments.push(newComment);
            await post.save();
            res.status(200).json({
                success: true,
                message: "Comment added"
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


// delete comment on a post
exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Post not found"
            });
        }
        // cheking if owner wants to delete comment
        if (post.owner.toString() === req.user._id.toString()) {

            if (req.body.commentId == undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Comment id is required"
                });
            }

            post.comments.forEach((comment, index) => {
                if (comment._id.toString() === req.body.commentId.toString()) {
                    return post.comments.splice(index, 1);
                }
            });
            await post.save();
            res.status(200).json({
                success: true,
                message: "Selected Comment deleted"
            });
        } else {
            post.comments.forEach((comment, index) => {
                if (comment.user.toString() === req.user._id.toString()) {
                    return post.comments.splice(index, 1);
                }
            });
            await post.save();
            res.status(200).json({
                success: true,
                message: "Your Comment deleted"
            });

        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}