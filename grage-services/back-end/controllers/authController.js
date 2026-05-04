const bcrypt = require("bcryptjs");
const { getDB } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const generateOTP = require("../utils/otp");
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { getFrontendBaseUrl } = require('../utils/frontendOrigin');

const OTP_EXPIRY_MINUTES = 5;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;

const isTruthyVerificationValue = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return value === true || value === 1 || normalized === 'true' || normalized === '1' || normalized === 'active';
};

const isEmailVerified = (user) => {
  if (!user) return false;

  // Admins may be seeded without OTP flow, so allow them to log in.
  if (String(user.role || '').toLowerCase() === 'admin') {
    return true;
  }

  return isTruthyVerificationValue(user.status) || isTruthyVerificationValue(user.isActive);
};

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const verifyPassword = async (plainPassword, storedPassword) => {
  if (!plainPassword || !storedPassword) {
    return { isValid: false, shouldMigrate: false };
  }

  const stored = String(storedPassword);
  if (isBcryptHash(stored)) {
    return {
      isValid: await bcrypt.compare(plainPassword, stored),
      shouldMigrate: false,
    };
  }

  const plainMatch = plainPassword === stored;
  return {
    isValid: plainMatch,
    shouldMigrate: plainMatch,
  };
};

const buildOtpEmailTemplate = (name, otp) => {
  const safeName = String(name || 'Customer').trim();
  const safeOtp = String(otp || '').trim();

  return `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;box-shadow:0 8px 28px rgba(15,23,42,0.08);overflow:hidden;">
              <tr>
                <td style="background:#111827;padding:20px 28px;color:#ffffff;">
                  <h1 style="margin:0;font-size:20px;line-height:1.4;">Email Verification OTP</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 28px;">
                  <p style="margin:0 0 12px;color:#374151;font-size:15px;">Hello <strong>${safeName}</strong>,</p>
                  <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
                    Thank you for registering with AUTOX. Use the following OTP to verify your email address.
                  </p>
                  <div style="margin:14px 0 20px;padding:18px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;text-align:center;">
                    <div style="font-size:12px;color:#6b7280;letter-spacing:1px;margin-bottom:8px;">YOUR OTP CODE</div>
                    <div style="font-size:30px;font-weight:700;letter-spacing:6px;color:#111827;">${safeOtp}</div>
                  </div>
                  <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
                  <p style="margin:0;color:#6b7280;font-size:13px;">If you did not request this, you can ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
                  AUTOX Vehicle Service Booking System
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const buildPasswordResetEmailTemplate = (name, resetLink) => {
  const safeName = String(name || 'Customer').trim();
  const safeLink = String(resetLink || '').trim();

  return `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;box-shadow:0 8px 28px rgba(15,23,42,0.08);overflow:hidden;">
              <tr>
                <td style="background:#dc2626;padding:20px 28px;color:#ffffff;">
                  <h1 style="margin:0;font-size:20px;line-height:1.4;">Password Reset Request</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 28px;">
                  <p style="margin:0 0 12px;color:#374151;font-size:15px;">Hello <strong>${safeName}</strong>,</p>
                  <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
                    We received a request to reset your password for your AUTOX account. Click the button below to create a new password.
                  </p>
                  <div style="margin:20px 0;text-align:center;">
                    <a href="${safeLink}" style="display:inline-block;padding:12px 28px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
                  </div>
                  <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">Or copy and paste this link in your browser:</p>
                  <p style="margin:0 0 16px;color:#3b82f6;font-size:12px;word-break:break-all;"><a href="${safeLink}" style="color:#3b82f6;text-decoration:none;">${safeLink}</a></p>
                  <div style="margin:16px 0;padding:12px;border-left:4px solid #fbbf24;background:#fffbeb;">
                    <p style="margin:0;color:#92400e;font-size:12px;"><strong>⚠️ Security Note:</strong> This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
                  AUTOX Vehicle Service Booking System
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    userId: user.userId,
    name: user.name || user.fullName,
    fullName: user.fullName || user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    gender: user.gender || null,
    address: user.address || '',
    pincode: user.pincode || '',
    city: user.city || '',
    vehicle: user.vehicle || '',
    registration: user.registration || '',
    profilePhotoUrl: user.profilePhotoUrl || '',
    rating: user.rating || null,
    createdAt: user.createdAt || null,
  };
};

const buildAuthResponse = (user) => {
  const accessToken = generateAccessToken(user);
  return {
    success: true,
    token: accessToken,
    accessToken,
    data: sanitizeUser(user),
    user: sanitizeUser(user)
  };
};

const createUniqueUsername = async (db, email, fallbackName = 'user') => {
  const base = String(email || fallbackName || 'user')
    .split('@')[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '') || 'user';

  const baseCandidate = base.length >= 3 ? base : `${base}user`;
  const exists = await db.collection('users').findOne({ username: baseCandidate });
  if (!exists) {
    return baseCandidate;
  }

  return `${baseCandidate}${Date.now().toString().slice(-5)}`;
};

const findUserForLogin = async (db, identifier) => {
  if (!identifier) return null;
  const trimmed = String(identifier).trim();
  const safeIdentifier = escapeRegex(trimmed);

  let user = await db.collection('users').findOne({ email: trimmed.toLowerCase() });
  if (user) return user;

  // Backward compatibility for legacy records with case-sensitive email storage.
  user = await db.collection('users').findOne({ email: { $regex: `^${safeIdentifier}$`, $options: 'i' } });
  if (user) return user;

  user = await db.collection('users').findOne({ username: trimmed });
  if (user) return user;

  user = await db.collection('users').findOne({ username: { $regex: `^${safeIdentifier}$`, $options: 'i' } });
  if (user) return user;

  user = await db.collection('users').findOne({ phone: trimmed });
  if (user) return user;

  if (trimmed.includes('@')) {
    const usernameGuess = trimmed.split('@')[0];
    user = await db.collection('users').findOne({ username: usernameGuess });
    if (user) return user;
  }

  return null;
};

const loginUser = async (req, res, next) => {
  try {
    const db = getDB();
    const { username, email, password } = req.body;

    const identifier = username || email;
    const user = await findUserForLogin(db, identifier);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const storedPassword = user.password || user.passwordHash;
    const passwordCheck = await verifyPassword(password, storedPassword);

    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    if (!isEmailVerified(user)) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email'
      });
    }

    // Migrate old plaintext passwords (seeded/test data) to bcrypt after first successful login.
    if (passwordCheck.shouldMigrate) {
      const migratedHash = await bcrypt.hash(password, 10);
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: { password: migratedHash, passwordHash: migratedHash, updatedAt: new Date() },
        }
      );
      user.password = migratedHash;
      user.passwordHash = migratedHash;
    }

    const refreshToken = generateRefreshToken(user);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { refreshToken } }
    );

    res.json({
      ...buildAuthResponse(user),
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const createRegister = async (req, res, next) => {
  try {
    const db = getDB();

    const {
      name,
      username,
      email,
      password,
      phone,
      gender,
      emailOtp,
      address,
      pincode,
      status,
      role
    } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const requestedUsername = String(username || '').trim();
    if (requestedUsername) {
      const existingUsername = await db.collection("users").findOne({ username: requestedUsername });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
    }

    const existingEmail = await db.collection("users").findOne({ email: normalizedEmail });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalUsername = requestedUsername || await createUniqueUsername(db, normalizedEmail, name);

    // Generate numeric userId
    const [lastUser] = await db
      .collection('users')
      .find({ userId: { $type: 'number' } })
      .sort({ userId: -1 })
      .limit(1)
      .toArray();
    const nextUserId = (lastUser?.userId || 999) + 1;
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const newRegister = {
      userId: nextUserId,
      name,
      username: finalUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
      phone,
      gender,
      emailOtp: otp,
      otp,
      otp_expiry: otpExpiry,
      address,
      pincode,
      status: false,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.collection("users").insertOne(newRegister);
    const savedUser = {
      ...newRegister,
      _id: insertResult.insertedId
    };

    const refreshToken = generateRefreshToken(savedUser);
    await db.collection('users').updateOne(
      { _id: insertResult.insertedId },
      { $set: { refreshToken } }
    );

    await sendEmail(
      normalizedEmail,
      'Verify your email - AUTOX OTP',
      buildOtpEmailTemplate(name || finalUsername || 'Customer', otp)
    );

    res.status(201).json({
      ...buildAuthResponse(savedUser),
      refreshToken,
      message: "User registered successfully. Please verify your email with OTP.",
      data: {
        ...sanitizeUser(savedUser),
        otpExpiresAt: otpExpiry
      },
      user: {
        ...sanitizeUser(savedUser),
        otpExpiresAt: otpExpiry
      }
    });
  } catch (error) {
    next(error);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const db = getDB();
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          otp,
          otp_expiry: otpExpiry,
          emailOtp: otp,
          updatedAt: new Date(),
        },
      }
    );

    await sendEmail(
      email,
      'Verify your email - AUTOX OTP',
      buildOtpEmailTemplate(user?.name || user?.fullName || user?.username || 'Customer', otp)
    );

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        email,
        otpExpiresAt: otpExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const db = getDB();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || String(user.otp) !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          status: true,
          isActive: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
        $unset: {
          otp: '',
          otp_expiry: '',
          emailOtp: '',
        },
      }
    );

    return res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  return createRegister(req, res, next);
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  req.body = { username: email, email, password };
  return loginUser(req, res, next);
};

const forgotPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const email = String(req.body?.email || '').trim().toLowerCase();
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

    // Store hashed token in database
    await db.collection('passwordResets').insertOne({
      userId: user._id,
      tokenHash,
      used: false,
      expiresAt: resetTokenExpiry,
      createdAt: new Date()
    });

    // Build reset link from the requesting frontend origin when possible.
    const frontendBaseUrl = getFrontendBaseUrl(req);
    const resetLink = `${frontendBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    await sendEmail(
      email,
      'Reset your AUTOX password',
      buildPasswordResetEmailTemplate(user?.name || user?.fullName || user?.username || 'Customer', resetLink)
    );

    return res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const { token, email, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!token || !email || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token, email, and new password are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash the token to compare with database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const normalizedEmail = String(email).trim().toLowerCase();

    // Find the password reset record
    const resetRecord = await db.collection('passwordResets').findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Verify the user exists and matches the email
    const user = await db.collection('users').findOne({
      _id: resetRecord.userId,
      email: normalizedEmail
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: newPasswordHash,
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      }
    );

    // Mark reset token as used
    await db.collection('passwordResets').updateOne(
      { _id: resetRecord._id },
      { 
        $set: { 
          used: true,
          usedAt: new Date()
        }
      }
    );

    // Send confirmation email
    const confirmationEmail = `
      <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;box-shadow:0 8px 28px rgba(15,23,42,0.08);overflow:hidden;">
                <tr>
                  <td style="background:#10b981;padding:20px 28px;color:#ffffff;">
                    <h1 style="margin:0;font-size:20px;line-height:1.4;">✓ Password Changed Successfully</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px 28px;">
                    <p style="margin:0 0 12px;color:#374151;font-size:15px;">Hi,</p>
                    <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
                      Your password has been successfully reset. You can now log in to your AUTOX account with your new password.
                    </p>
                    <div style="margin:16px 0;padding:12px;border-left:4px solid #3b82f6;background:#eff6ff;">
                      <p style="margin:0;color:#1e3a8a;font-size:12px;"><strong>ℹ️ Security Tip:</strong> If you didn't request this change, please contact support immediately.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
                    AUTOX Vehicle Service Booking System
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail(
      normalizedEmail,
      'Password Reset Successful - AUTOX',
      confirmationEmail
    );

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  return res.json({
    success: true,
    data: sanitizeUser(req.user)
  });
};

const updateMe = async (req, res, next) => {
  try {
    const db = getDB();
    const updates = {};
    const { name, phone, address, pincode, city, vehicle, registration } = req.body;

    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (pincode !== undefined) updates.pincode = pincode;
    if (city !== undefined) updates.city = city;
    if (vehicle !== undefined) updates.vehicle = vehicle;
    if (registration !== undefined) updates.registration = registration;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.updatedAt = new Date();

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updates }
    );

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });

    return res.json({
      success: true,
      message: 'Profile updated',
      data: sanitizeUser(updatedUser)
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const db = getDB();
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required"
      });
    }
    const decoded = jwt.verify(refreshToken, "qweuansdasdg123123");

    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id),
      refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      token: accessToken,
      accessToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  me,
  updateMe,
  createRegister,
  loginUser,
  refreshToken
};