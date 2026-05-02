const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const uploadProfilePhoto = async (req, res, next) => {
  try {
    const db = getDB();
    const numericUserId = Number(req.user.userId || req.user.id);
    const userObjectId = String(req.user._id || '').trim();
    const userFilter = Number.isFinite(numericUserId)
      ? { userId: numericUserId }
      : (ObjectId.isValid(userObjectId) ? { _id: new ObjectId(userObjectId) } : null);

    if (!userFilter) {
      return res.status(400).json({
        success: false,
        message: 'Unable to resolve user identity for profile photo upload'
      });
    }

    const { fileName, mimeType, imageBase64, photo } = req.body;
    const finalImageBase64 = imageBase64 || photo;

    if (!finalImageBase64) {
      return res.status(400).json({
        success: false,
        message: 'imageBase64 is required'
      });
    }

    const uploadedAt = new Date().toISOString();
    const photoOwnerId = Number.isFinite(numericUserId) ? numericUserId : userObjectId;
    const photoUrl = `/uploads/profile/${photoOwnerId}-${Date.now()}`;

    await db.collection('uploads').insertOne({
      userId: Number.isFinite(numericUserId) ? numericUserId : null,
      userObjectId,
      type: 'profile-photo',
      fileName: fileName || 'profile-photo',
      mimeType: mimeType || 'image/*',
      imageBase64: finalImageBase64,
      photoUrl,
      uploadedAt
    });

    await db.collection('users').updateOne(
      userFilter,
      { $set: { profilePhotoUrl: photoUrl, updatedAt: uploadedAt } }
    );

    return res.status(201).json({
      success: true,
      message: 'Profile photo uploaded',
      data: {
        photoUrl,
        uploadedAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadProfilePhoto
};
