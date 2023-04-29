const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: 2,
      maxlength: 25,
      required: [true, 'User must have a name'],
    },
    email: {
      type: String,
      required: [true, 'User must have an email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      unique: true,
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'guide', 'lead-guide'],
        message: 'role can either be: user, admin, guide, lead-guide',
      },
      default: 'user',
      select: false,
    },
    password: {
      type: String,
      required: [true, 'User must have a password'],
      minlength: [8, 'password must be at least 8 characters long'],
      maxlength: [30, 'password must be below 30 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'User must confirm their password'],
      minlength: [8, 'password must be at least 8 characters long'],
      maxlength: [30, 'password must be below 30 characters'],
      validate: {
        validator: function (val) {
          return this.password === val;
        },
        message: 'Password fields dose not match! Please try again.',
      },
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: String,
    passwordResetTokenExpiresIn: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  if (!this.isNew) this.passwordChangedAt = Date.now() - 2000;

  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.isPasswordCorrectAndSame = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.hasPasswordChangedAfter = function (JwtInitTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedAt = Math.trunc(
      this.passwordChangedAt.getTime() / 1000
    );
    return passwordChangedAt > JwtInitTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpiresIn = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
