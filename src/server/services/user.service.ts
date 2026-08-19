import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import User, { UserDoc } from "@/models/User";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from "../core/errors";
import {
  PaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "../core/pagination";
import {
  CreateUserInput,
  UpdateUserInput,
  InviteUserInput,
  UpdateProfileInput,
} from "../dtos/user.dto";

/**
 * Retrieves a list of users with optional filtering and pagination.
 */
export async function getUsers(
  pagination?: PaginationParams,
  filters?: { role?: string; status?: string; department?: string }
) {
  await connectToDatabase();

  const query: Record<string, any> = {};

  if (filters?.role) {
    query.role = filters.role;
  }
  if (filters?.status) {
    query.status = filters.status;
  }
  if (filters?.department) {
    query.department = { $regex: new RegExp(`^${filters.department}$`, 'i') };
  }
  if (pagination?.search) {
    const searchRegex = createSafeSearchRegex(pagination.search);
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
      { department: searchRegex },
    ];
  }

  if (pagination) {
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password -resetPasswordToken -activationToken")
      .sort({ [pagination.sortBy || "createdAt"]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      users,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  // Non-paginated query (for backwards compatibility)
  const users = await User.find(query)
    .select("-password -resetPasswordToken -activationToken")
    .sort({ createdAt: -1 })
    .lean();

  return { users };
}

/**
 * Retrieves a user by their ID.
 */
export async function getUserById(id: string) {
  await connectToDatabase();
  const user = await User.findById(id)
    .select("-password -resetPasswordToken -activationToken")
    .lean();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

/**
 * Creates a new user.
 */
export async function createUser(input: CreateUserInput) {
  await connectToDatabase();

  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError("User already exists with this email address");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const newUser = await User.create({
    ...input,
    email: input.email.toLowerCase(),
    password: hashedPassword,
    status: input.status || "active",
    isActivated: input.isActivated ?? true,
  });

  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    status: newUser.status,
  };
}

/**
 * Updates an existing user by ID.
 */
export async function updateUser(id: string, input: UpdateUserInput) {
  await connectToDatabase();

  const updateData: Record<string, any> = { ...input };

  if (input.email) {
    const existing = await User.findOne({
      email: input.email.toLowerCase(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictError("Another user already exists with this email");
    }
    updateData.email = input.email.toLowerCase();
  }

  if (input.password) {
    updateData.password = await bcrypt.hash(input.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .select("-password -resetPasswordToken -activationToken")
    .lean();

  if (!updatedUser) {
    throw new NotFoundError("User not found to update");
  }

  return updatedUser;
}

/**
 * Deletes a user by ID.
 */
export async function deleteUser(id: string) {
  await connectToDatabase();
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("User not found to delete");
  }
  return { id };
}

/**
 * Invites a new user by generating an activation token and sending an invite email.
 */
export async function inviteUser(input: InviteUserInput) {
  await connectToDatabase();

  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError("A user with this email address already exists");
  }

  const activationToken = crypto.randomBytes(32).toString("hex");

  const newUser = await User.create({
    name: input.name || input.email.split("@")[0],
    email: input.email.toLowerCase(),
    role: input.role,
    department: input.department || "",
    status: "active",
    isActivated: false,
    activationToken,
  });

  const activationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/activate?token=${activationToken}`;

  // Log or send email if configured
  console.log(`[User Invite] Activation link for ${input.email}: ${activationUrl}`);

  return {
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
    activationToken,
    activationUrl,
  };
}

/**
 * Updates the profile of the currently logged-in user.
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User profile not found");
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new BadRequestError("Current password is required to set a new password");
    }

    if (user.password) {
      const match = await bcrypt.compare(input.currentPassword, user.password);
      if (!match) {
        throw new BadRequestError("Current password does not match");
      }
    }

    user.password = await bcrypt.hash(input.newPassword, 10);
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.firstName !== undefined) user.firstName = input.firstName;
  if (input.lastName !== undefined) user.lastName = input.lastName;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.address !== undefined) user.address = input.address;
  if (input.dob !== undefined) user.dob = input.dob;
  if (input.parentName !== undefined) user.parentName = input.parentName;
  if (input.parentContact !== undefined) user.parentContact = input.parentContact;
  if (input.department !== undefined) user.department = input.department;
  if (input.expertise !== undefined) user.expertise = input.expertise;
  if (input.qualification !== undefined) user.qualification = input.qualification;
  if (input.linkedin !== undefined) user.linkedin = input.linkedin;

  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    department: user.department,
    firstName: user.firstName,
    lastName: user.lastName,
    address: user.address,
    dob: user.dob,
    parentName: user.parentName,
    parentContact: user.parentContact,
    expertise: user.expertise,
    qualification: user.qualification,
    linkedin: user.linkedin,
  };
}
