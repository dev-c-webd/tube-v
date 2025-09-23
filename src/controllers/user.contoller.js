import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


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
        field?.trim === "")
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

    // 4
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log(avatarLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 5
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (avatar) {
        throw new ApiError(400, "Avatar file is required");
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

export { registerUser }; 