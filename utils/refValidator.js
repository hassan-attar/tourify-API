module.exports = function (schema) {
  return async function (objectId) {
    const fetchedDoc = await schema.find({ _id: { $eq: objectId } });
    if (!fetchedDoc || !fetchedDoc.length) return false;
    return true;
  };
};
