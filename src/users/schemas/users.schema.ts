import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users.interface';
import { BadRequestException } from '@nestjs/common';

const Schema = mongoose.Schema;

export const UserSchema = new Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  mobile: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  movement: {
    type: String,
    enum: ['IN', 'AL', 'RSV', 'VC', 'MC', 'OUT'],
    default: 'OUT',
  },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessRole' },
  roles: [String],
  access: [String],
  isManager: { type: Boolean, default: false },
});
UserSchema.set('toJSON', { virtuals: true });

UserSchema.pre<User>('save', function (next) {
  // Make sure not to rehash the password if it is already hashed
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a salt and use it to hash the user's password
  bcrypt.genSalt(10, (genSaltError, salt) => {
    if (genSaltError) {
      return next(genSaltError);
    }

    bcrypt.hash(this.password, salt, (error, hash) => {
      if (error) {
        return next(error);
      }
      this.password = hash;
      next();
    });
  });
});

// UserSchema.methods.comparePassword = async function (
//   enteredPassword: string,
// ): Promise<boolean> {
//   console.log('enteredPassword', enteredPassword);

//   const isMatch = await bcrypt.compare(enteredPassword, this.password);
//   if (isMatch) {
//     console.log('this.password', this.password);
//     return isMatch;
//   }
//   throw new BadRequestException('invalid password');
// };
