const UserService = require('../services/user.service');
const jwtUtils = require('../utils/jwt.utils');


const registerUser = async (req, res) => {
    try {
        const { name, email, password, preferences } = req.body;

        const user = await UserService.createUser({
            name,
            email,
            password,
            preferences
        });

        const token = jwtUtils.generateToken(user);

        res.status(201).json({
            success: true,
            data: {
                user,
                token
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserService.loginUser(email, password);
        const token = jwtUtils.generateToken(user);
        
        res.status(200).json({
            success: true,
            data: {
                user,
                // : {
                //     id: user._id,
                //     name: user.name,
                //     email: user.email,
                //     preferences: user.preferences,
                //     createdAt: user.createdAt,
                //     updatedAt: user.updatedAt
                // },
                token
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};


const getUserDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserService.getUserById(userId);

        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;

        const updatedUser = await UserService.updateUserPreferences(userId, preferences);

        res.status(200).json({
            success: true,
            data: {
                user : updatedUser
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserDetails,
    updateUserPreferences
};