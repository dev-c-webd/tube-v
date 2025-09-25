import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById( userId );
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");

    }
}

const registerUser = asyncHandler(async (req, res) => {
    // 1. get user details from frontend
    // 2. validation - not empty
    // 3. check if user already exists: username, email
    // 4. check for images, check for avatar
    // 5. upload them to cloudinary, avatar
    // 6. create user object - create entry in db
    // 7. remove password and refresh token field from response
    // 8. check for user creation
    // 9. return res

    // 1
    const { fullName, email, username, password } = req.body;

    // 2
    if ([fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required"); 
    }

    // 3
    const userExists= await User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExists) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // console.log(req.files);
    
    // 4
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 5
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar. Try again.");
    }
     
    // 6
    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase()
    })

    // 7 then 8
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // 8
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering  the user");
    }

    // 9
    res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully. ")
    )
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie


    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(404, "email or username is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "email or username does not exists");
    }

    // using "user" not "User" as this isPasswordCorrect method is of our user not of mongoose like findOne
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(404, "Incorrect Credentials");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User LoggedIn Successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                accessToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Loggedout Successfully"));
})

export { registerUser, loginUser, logoutUser }; 