const User = require('../models/User');
const Post = require('../models/Post');
const { sendEmail } = require('../middlewares/sendEmail');
const crypto = require('crypto');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        user = await User.create({
            name,
            email,
            password,
            avatar: { public_id: "sample_id", url: "sampleurl" }
        });
        const token = await user.generateToken();
        const options = {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };
        res.status(201).cookie('token', token, options).json({
            success: true,
            user,
            token
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// login a user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist'
            });
        }
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }
        const token = await user.generateToken();
        const options = {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };
        res.status(200).cookie('token', token, options).json({
            success: true,
            user,
            token
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Logout a user
exports.logout = async (req, res) => {
    try {
        res.status(200).clearCookie('token').json({
            success: true,
            message: 'User logged out'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// follow and unfollow user
exports.followAndUnfollow = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const logedInUser = await User.findById(req.user._id);
        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist'
            });
        }

        if (logedInUser.following.includes(userToFollow._id)) {
            const indexfollowing = logedInUser.following.indexOf(userToFollow._id);
            const indexfollowers = userToFollow.followers.indexOf(logedInUser._id);

            logedInUser.following.splice(indexfollowing, 1);
            userToFollow.followers.splice(indexfollowers, 1);

            await logedInUser.save();
            await userToFollow.save();

            return res.status(200).json({
                success: true,
                message: 'User unfollowed'
            });
        } else {
            logedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(logedInUser._id);
            await logedInUser.save();
            await userToFollow.save();

            res.status(200).json({
                success: true,
                message: 'User followed'
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// update password
exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+password');
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide old and new password'
            });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// update profile
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { name, email } = req.body;
        if (name) {
            user.name = name;
        }
        if (email) {
            user.email = email;
        }

        // User Avatar:Todo

        await user.save();
        res.status(200).json({
            success: true,
            message: 'Profile updated'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}


// Delete Profile
exports.deleteProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);
        const posts = user.posts;
        const followers = user.followers;
        const following = user.following;
        const userId = user._id;
        await user.remove();

        // Logout user after deleting profile
        res.clearCookie('token');

        // Delete all posts of the user
        for (let i = 0; i < posts.length; i++) {
            const post = await Post.findById({_id: posts[i]});
            await post.remove();
        }

        // Removing user from followers following list
        for (let i = 0; i < followers.length; i++) {
            const follower = await User.findById({_id: followers[i]});
            const index = follower.following.indexOf(userId);
            follower.following.splice(index, 1);
            await follower.save();
        }

        // Removing user from followings follower list
        for (let i = 0; i < following.length; i++) {
            const follows = await User.findById({_id: following[i]});
            const index = follows.followers.indexOf(userId);
            follows.followers.splice(index, 1);
            await follows.save();
        }

        res.status(200).json({
            success: true,
            message: 'Profile deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
  

// get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('posts');
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('posts');
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// foreget password
exports.forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const resetPaswordToken = await user.generatePasswordResetToken();
        await user.save();
        const resetPasswordUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetPaswordToken}`;
        const message = `Reset your password by clicking this link ${resetPasswordUrl}`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Reset Password',
                message
            });
            res.status(200).json({
                success: true,
                message: 'Email sent'
            });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// reset password
exports.resetPassword = async (req, res) => {
    try {
        const token = req.params.token;
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ resetPasswordToken, passwordResetExpires: { $gt: Date.now() } });
        
        if(!user){
            return res.status(400).json({
                success: false,
                message: 'Token is invalid or expired'
            });
        }
        const { password } = req.body;
        user.password = password;
        user.passwordResetToken = undefined;    
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset'
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
        
    }
