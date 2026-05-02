const { getDB } = require('../config/db');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveAuthUserFilter = (authUser = {}) => {
  const numericId = Number(authUser?.userId ?? authUser?.id);
  const objectIdText = String(authUser?._id || '').trim();
  const emailText = String(authUser?.email || '').trim();

  const candidates = [];
  if (Number.isFinite(numericId) && numericId > 0) {
    candidates.push({ userId: numericId }, { userId: String(numericId) });
  }
  if (objectIdText) {
    candidates.push({ userObjectId: objectIdText }, { userId: objectIdText });
  }
  if (emailText) {
    candidates.push({ email: { $regex: `^${escapeRegex(emailText)}$`, $options: 'i' } });
  }

  if (!candidates.length) return {};
  return { $or: candidates };
};

const resolveReviewUserFilter = (authUser = {}) => {
  const numericId = Number(authUser?.userId ?? authUser?.id);
  const objectIdText = String(authUser?._id || '').trim();
  const emailText = String(authUser?.email || '').trim();

  const candidates = [];
  if (Number.isFinite(numericId) && numericId > 0) {
    candidates.push({ userId: numericId }, { userId: String(numericId) });
  }
  if (objectIdText) {
    candidates.push({ userObjectId: objectIdText });
  }
  if (emailText) {
    candidates.push({ email: { $regex: `^${escapeRegex(emailText)}$`, $options: 'i' } });
  }

  if (!candidates.length) return {};
  return { $or: candidates };
};

const getCompletedBookingsForUser = async (db, authUser = {}) => {
  const userFilter = resolveAuthUserFilter(authUser);
  return db
    .collection('bookings')
    .find({
      ...userFilter,
      status: { $in: ['completed', 'Completed'] },
    })
    .sort({ id: -1 })
    .toArray();
};

const getReviewableBookings = async (req, res, next) => {
  try {
    const db = getDB();
    const completedBookings = await getCompletedBookingsForUser(db, req.user);

    if (!completedBookings.length) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    const bookingIds = completedBookings
      .map((item) => item.id)
      .filter((id) => id !== undefined && id !== null);

    const reviewUserFilter = resolveReviewUserFilter(req.user);
    const reviews = await db
      .collection('reviews')
      .find({
        ...reviewUserFilter,
        bookingId: { $in: bookingIds.concat(bookingIds.map((id) => String(id))) },
      })
      .toArray();

    const reviewMap = new Map();
    reviews.forEach((review) => {
      reviewMap.set(String(review.bookingId), review);
    });

    const data = completedBookings.map((booking) => {
      const key = String(booking.id);
      const review = reviewMap.get(key);
      return {
        bookingId: booking.id,
        serviceName: booking.serviceName || booking.service || 'Service',
        date: booking.date || (booking.scheduledAt ? String(booking.scheduledAt).split('T')[0] : ''),
        mechanicName: booking.mechanicName || booking.mechanic || 'N/A',
        existingRating: Number(review?.rating || 0),
        existingComment: review?.comment || '',
        reviewedAt: review?.updatedAt || review?.createdAt || null,
      };
    });

    return res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    return next(error);
  }
};

const submitRating = async (req, res, next) => {
  try {
    const db = getDB();
    const bookingId = Number(req.body.bookingId);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid bookingId is required' });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }

    const userFilter = resolveAuthUserFilter(req.user);
    const booking = await db.collection('bookings').findOne({
      ...userFilter,
      id: bookingId,
      status: { $in: ['completed', 'Completed'] },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Completed booking not found for this customer',
      });
    }

    const now = new Date().toISOString();
    const numericUserId = Number(req.user?.userId ?? req.user?.id);
    const userObjectId = String(req.user?._id || '').trim();
    const userEmail = String(req.user?.email || '').trim().toLowerCase();
    const reviewUserFilter = resolveReviewUserFilter(req.user);

    const updateResult = await db.collection('reviews').updateOne(
      {
        ...reviewUserFilter,
        bookingId: { $in: [bookingId, String(bookingId)] },
      },
      {
        $set: {
          bookingId,
          rating,
          comment,
          updatedAt: now,
          serviceName: booking.serviceName || booking.service || '',
        },
        $setOnInsert: {
          userId: Number.isFinite(numericUserId) && numericUserId > 0 ? numericUserId : undefined,
          userObjectId: userObjectId || undefined,
          email: userEmail || undefined,
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const saved = await db.collection('reviews').findOne({
      ...reviewUserFilter,
      bookingId,
    });

    return res.status(200).json({
      success: true,
      message: updateResult.upsertedCount > 0 ? 'Rating submitted successfully' : 'Rating updated successfully',
      data: {
        bookingId,
        rating,
        comment,
        reviewId: saved?._id || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getReviewableBookings,
  submitRating,
};
