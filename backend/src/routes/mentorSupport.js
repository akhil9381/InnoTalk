const express = require('express');
const Joi = require('joi');
const MentorMessage = require('../models/MentorMessage');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const sendMessageSchema = Joi.object({
  mentorId: Joi.string().optional(),
  userId: Joi.string().optional(),
  message: Joi.string().trim().min(1).max(4000).required(),
});

const conversationQuerySchema = Joi.object({
  mentorId: Joi.string().optional(),
  userId: Joi.string().optional(),
});

const toConversationSummary = (message, currentUserId) => {
  const user = message.user;
  const mentor = message.mentor;
  const lastSender = message.senderRole === 'mentor' ? mentor : user;

  return {
    conversationId: `${user._id}-${mentor._id}`,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
    },
    mentor: {
      _id: mentor._id,
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      fullName: mentor.fullName,
      email: mentor.email,
      expertise: mentor.mentorProfile?.expertise || [],
      company: mentor.mentorProfile?.company || '',
      designation: mentor.mentorProfile?.designation || '',
    },
    latestMessage: {
      id: message._id,
      senderRole: message.senderRole,
      senderName: lastSender?.fullName || `${lastSender?.firstName || ''} ${lastSender?.lastName || ''}`.trim(),
      message: message.message,
      createdAt: message.createdAt,
    },
    unreadCount:
      String(currentUserId) === String(mentor._id)
        ? Number(!message.readByMentor && message.senderRole === 'user')
        : Number(!message.readByUser && message.senderRole === 'mentor'),
  };
};

router.get('/mentors', authenticate, authorize('user'), async (req, res) => {
  try {
    const mentors = await User.find({
      role: 'mentor',
      isActive: true,
    })
      .select('firstName lastName email mentorProfile profile.bio')
      .sort({ 'mentorProfile.rating': -1, createdAt: 1 });

    res.json({
      data: mentors.map((mentor) => ({
        _id: mentor._id,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        fullName: mentor.fullName,
        email: mentor.email,
        bio: mentor.profile?.bio || '',
        expertise: mentor.mentorProfile?.expertise || [],
        company: mentor.mentorProfile?.company || '',
        designation: mentor.mentorProfile?.designation || '',
        rating: mentor.mentorProfile?.rating || 0,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch mentors:', error);
    res.status(500).json({
      error: 'Failed to fetch mentors',
      message: 'An error occurred while loading mentors.',
    });
  }
});

router.get('/inbox', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const messages = await MentorMessage.find({ mentor: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email mentorProfile')
      .lean();

    const seen = new Map();
    for (const message of messages) {
      const key = String(message.user._id);
      if (!seen.has(key)) {
        seen.set(key, toConversationSummary(message, req.user._id));
      } else if (!message.readByMentor && message.senderRole === 'user') {
        seen.get(key).unreadCount += 1;
      }
    }

    res.json({
      data: Array.from(seen.values()),
    });
  } catch (error) {
    logger.error('Failed to fetch mentor inbox:', error);
    res.status(500).json({
      error: 'Failed to fetch mentor inbox',
      message: 'An error occurred while loading mentor messages.',
    });
  }
});

router.get('/conversation', authenticate, async (req, res) => {
  try {
    const { error, value } = conversationQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const counterpartId = req.user.role === 'mentor' ? value.userId : value.mentorId;
    if (!counterpartId) {
      return res.status(400).json({
        error: 'Counterpart required',
        message: req.user.role === 'mentor' ? 'A userId is required.' : 'A mentorId is required.',
      });
    }

    const query =
      req.user.role === 'mentor'
        ? { mentor: req.user._id, user: counterpartId }
        : { user: req.user._id, mentor: counterpartId };

    const messages = await MentorMessage.find(query)
      .sort({ createdAt: 1 })
      .populate('user', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email mentorProfile')
      .populate('sender', 'firstName lastName')
      .lean();

    if (req.user.role === 'mentor') {
      await MentorMessage.updateMany(
        { mentor: req.user._id, user: counterpartId, senderRole: 'user', readByMentor: false },
        { $set: { readByMentor: true } },
      );
    } else {
      await MentorMessage.updateMany(
        { user: req.user._id, mentor: counterpartId, senderRole: 'mentor', readByUser: false },
        { $set: { readByUser: true } },
      );
    }

    res.json({
      data: {
        messages: messages.map((message) => ({
          _id: message._id,
          message: message.message,
          senderRole: message.senderRole,
          senderName:
            message.sender?.fullName ||
            `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim(),
          createdAt: message.createdAt,
        })),
        participants: messages[0]
          ? {
              user: {
                _id: messages[0].user._id,
                fullName: messages[0].user.fullName,
                firstName: messages[0].user.firstName,
                lastName: messages[0].user.lastName,
                email: messages[0].user.email,
              },
              mentor: {
                _id: messages[0].mentor._id,
                fullName: messages[0].mentor.fullName,
                firstName: messages[0].mentor.firstName,
                lastName: messages[0].mentor.lastName,
                email: messages[0].mentor.email,
                expertise: messages[0].mentor.mentorProfile?.expertise || [],
                company: messages[0].mentor.mentorProfile?.company || '',
                designation: messages[0].mentor.mentorProfile?.designation || '',
              },
            }
          : null,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch conversation:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation',
      message: 'An error occurred while loading the conversation.',
    });
  }
});

router.post('/messages', authenticate, async (req, res) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const counterpartId = req.user.role === 'mentor' ? value.userId : value.mentorId;
    if (!counterpartId) {
      return res.status(400).json({
        error: 'Counterpart required',
        message: req.user.role === 'mentor' ? 'A userId is required.' : 'A mentorId is required.',
      });
    }

    if (req.user.role === 'mentor') {
      const user = await User.findOne({ _id: counterpartId, role: 'user', isActive: true });
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The selected user could not be found.',
        });
      }
    } else {
      const mentor = await User.findOne({ _id: counterpartId, role: 'mentor', isActive: true });
      if (!mentor) {
        return res.status(404).json({
          error: 'Mentor not found',
          message: 'The selected mentor could not be found.',
        });
      }
    }

    const message = await MentorMessage.create({
      user: req.user.role === 'mentor' ? counterpartId : req.user._id,
      mentor: req.user.role === 'mentor' ? req.user._id : counterpartId,
      sender: req.user._id,
      senderRole: req.user.role,
      message: value.message,
      readByUser: req.user.role === 'user',
      readByMentor: req.user.role === 'mentor',
    });

    await message.populate('sender', 'firstName lastName');

    res.status(201).json({
      message: 'Message sent successfully',
      data: {
        _id: message._id,
        message: message.message,
        senderRole: message.senderRole,
        senderName:
          message.sender.fullName ||
          `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim(),
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    logger.error('Failed to send mentor message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: 'An error occurred while sending the message.',
    });
  }
});

module.exports = router;
