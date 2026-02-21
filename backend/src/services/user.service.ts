import mongoose from 'mongoose';
import User, { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { paginate, PaginationQuery, PaginatedResult } from '../utils/paginate';


export interface UpdateUserInput {
  name?: string;
  role?: string;
}


export interface UserListQuery extends PaginationQuery {
  role?: string;
}


class UserService {

  async getAllUsers(query: UserListQuery): Promise<PaginatedResult<IUser>> {
    const filter: Record<string, any> = {};
    if (query.role) filter['role'] = query.role;
    return paginate(User, filter, query);
  }


  async getUserById(
    targetUserId:  string,
    requesterId:   string,
    requesterRole: string
  ): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('Invalid user ID format', 400);
    }

    if (requesterRole === 'user' && targetUserId !== requesterId) {
      throw new AppError('You can only view your own profile', 403);
    }

    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404);

    return user;
  }


  async updateUser(
    targetUserId:  string,
    data:          UpdateUserInput,
    requesterId:   string,
    requesterRole: string
  ): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('Invalid user ID format', 400);
    }

    if (requesterRole !== 'admin' && targetUserId !== requesterId) {
      throw new AppError('You can only update your own profile', 403);
    }

    if (data.role !== undefined && requesterRole !== 'admin') {
      throw new AppError('Only admins can change user roles', 403);
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      { $set: data },
      { returnDocument: 'after', runValidators: true } // ← FIXED: was { new: true }
    );

    if (!user) throw new AppError('User not found', 404);

    return user;
  }


  async deleteUser(
    targetUserId: string,
    requesterId:  string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('Invalid user ID format', 400);
    }

    if (targetUserId === requesterId) {
      throw new AppError('You cannot delete your own account', 400);
    }

    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404);

    await User.findByIdAndUpdate(targetUserId, { $set: { deletedAt: new Date() } });
    // ↑ no options object → no deprecation warning, no change needed
  }
}


export const userService = new UserService();
