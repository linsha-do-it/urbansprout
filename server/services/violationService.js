const User = require('../models/User');

/**
 * Apply a content-policy violation to a user and update their status
 * according to the strike rules:
 *  - 1 violation → warning
 *  - 3 violations → posting disabled for 7 days
 *  - 5 violations → account suspension
 */
async function applyContentViolation(userId, reason = 'Content policy violation') {
  const user = await User.findById(userId);
  if (!user) return null;

  user.violationCount = (user.violationCount || 0) + 1;

  // Default: warning only
  let action = 'warning';

  if (user.violationCount >= 5) {
    // Suspend account
    user.status = 'suspended';
    user.suspensionEnd = null; // Explicit suspension, manual review needed
    user.suspensionReason = reason;
    action = 'suspended';
  } else if (user.violationCount >= 3) {
    // Disable posting for 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    user.postingDisabledUntil = sevenDaysFromNow;
    if (user.status === 'active') {
      user.status = 'active'; // keep active but with postingDisabledUntil applied
    }
    action = 'posting_disabled';
  }

  await user.save();

  return {
    user,
    action,
  };
}

module.exports = {
  applyContentViolation,
};

