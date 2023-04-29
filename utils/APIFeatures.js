class APIfeatures {
  constructor(query, userQuery) {
    this.query = query;
    this.userQuery = userQuery;
  }

  paginate() {
    const page = this.userQuery.page || 1;
    const limit = this.userQuery.limit || 20;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  selectFields() {
    if (this.userQuery.fields) {
      this.query = this.query.select(
        this.userQuery.fields.split(',').join(' ')
      );
    } else {
      this.query = this.query.select('-__v -privateTour');
    }
    return this;
  }

  sort() {
    if (this.userQuery.sort) {
      this.query = this.query.sort(this.userQuery.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt name');
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.userQuery };
    const excludedFields = ['page', 'fields', 'sort', 'limit'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // ADVANCED FILTERING
    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lt|lte)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
}

module.exports = APIfeatures;
