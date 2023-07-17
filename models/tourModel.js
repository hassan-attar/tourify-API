const mongoose = require('mongoose');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const slugify = require('slugify');
const validator = require('validator');

const User = require('./userModel');

// SCHEMA
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must be below 40 characters'],
      minlength: [10, 'Tour name must be above 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Tour must have a duration'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Tour difficulty can be: easy, medium, difficult',
      },
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a group size'],
      min: [1, 'minimum group size for a tour is 1'],
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price'],
      min: [0, 'minimum price is 0'],
    },
    priceDiscountPercentage: {
      type: Number,
      validate: [
        isDiscountValid,
        'discsount precentage must between 0 and 100',
      ],
    },
    ratingsAverage: {
      type: Number,
      default: 3,
      min: [1, 'rating can not be less than 1'],
      max: [5, 'rating can not be more than 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      required: [true, 'Tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have a cover Image'],
    },
    images: [String],
    startDates: {
      type: [Date],
      validate: {
        validator: function (dates) {
          return true;
          // return dates.every((date) => date > Date.now());
        },
        message: 'Tour Start Date must be for after Today.',
      },
    },
    privateTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        validate: {
          validator: async function (userID) {
            const fetchedUser = await User.find({ _id: { $eq: userID } });
            if (!fetchedUser || !fetchedUser.length) return false;
            return true;
          },
          message: 'Invalid guides IDs! Please try again.',
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});
// MONGOOSE MIDDLEWARES //

// DOCUMENT MIDDLEWARE
// ONLY initiates by .save() and .create() NOT .insertMany() or .insertOne()
tourSchema.pre('save', async function (next) {
  // generate tour slug
  this.slug = slugify(this.name, { lower: true });
  // generate product ID and price ID on stripe
  // await stripe.products.create({
  //   name: this.name,
  //   id: this.id,
  //   active: true,
  //   description: this.summary,
  //   tax_code: 'txcd_20030000',
  //   // url: `${req.protocol}://${req.get('host')}/tour/${this.slug}`,
  // });

  // await stripe.prices.create({
  //   currency: 'CAD',
  //   product: this.id,
  //   active: true,
  //   unit_amount: this.price * 100,
  // });
  next();
});

// Implementing pre save middleware for embeding tour guides : we also need the same functionality for updating
//Also if a guide changes their info, we need to come and Update it everywhere! which is not very efficient
// tourSchema.pre('save', async function (next) {
//   if (!this.guides.length) return next();
//   this.guides = await Promise.all(
//     this.guides.map(async (id) => await User.findById(id))
//   );
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log('doc was saved!');
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ privateTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(
//     `Query took ${Date.now() - this.start} milliseconds and ${
//       docs?.length
//     } was found!`
//   );
//   next();
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   console.log(this.pipeline());
//   this.pipeline().unshift({ $match: { privateTour: { $ne: true } } });
//   next();
// });

// tourSchema.post('aggregate', function (docs, next) {
//   console.log(docs);
//   next();
// });

// Make a Tour Model out of our Schema
const Tour = mongoose.model('Tour', tourSchema);
Tour.init().then(() => {});

module.exports = Tour;

// VALIDATOR FUNCTIONS
function isDiscountValid(val) {
  return val > 0 && val <= 100;
}
