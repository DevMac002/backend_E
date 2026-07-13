const { sequelize } = require('../config/database');
const User = require('./User');
const Post = require('./Post');
const PollVote = require('./PollVote');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const Message = require('./Message');
const RewardHistory = require('./RewardHistory');
const RoleChangeLog = require('./RoleChangeLog');
const Like = require('./Like');
const Comment = require('./Comment');
const Notification = require('./Notification');
const QuizAnswer = require('./QuizAnswer');
const Media = require('./Media');

User.hasMany(Post, { foreignKey: 'author_id' });
Post.belongsTo(User, { foreignKey: 'author_id' });

User.hasMany(PollVote, { foreignKey: 'user_id' });
Post.hasMany(PollVote, { foreignKey: 'post_id' });
PollVote.belongsTo(User, { foreignKey: 'user_id' });
PollVote.belongsTo(Post, { foreignKey: 'post_id' });

User.hasMany(Group, { foreignKey: 'created_by' });
Group.belongsTo(User, { foreignKey: 'created_by' });

Group.hasMany(GroupMember, { foreignKey: 'group_id' });
User.hasMany(GroupMember, { foreignKey: 'user_id' });
GroupMember.belongsTo(Group, { foreignKey: 'group_id' });
GroupMember.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Message, { foreignKey: 'sender_id' });
User.hasMany(Message, { foreignKey: 'receiver_id' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiver_id' });
Group.hasMany(Message, { foreignKey: 'group_id' });
Message.belongsTo(Group, { foreignKey: 'group_id' });

User.hasMany(RewardHistory, { foreignKey: 'user_id' });
User.hasMany(RewardHistory, { foreignKey: 'admin_id' });
RewardHistory.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
RewardHistory.belongsTo(User, { as: 'admin', foreignKey: 'admin_id' });

User.hasMany(RoleChangeLog, { foreignKey: 'user_id' });
User.hasMany(RoleChangeLog, { foreignKey: 'changed_by' });
RoleChangeLog.belongsTo(User, { as: 'target', foreignKey: 'user_id' });
RoleChangeLog.belongsTo(User, { as: 'changer', foreignKey: 'changed_by' });

User.hasMany(Like, { foreignKey: 'user_id' });
Post.hasMany(Like, { foreignKey: 'post_id' });
Like.belongsTo(User, { foreignKey: 'user_id' });
Like.belongsTo(Post, { foreignKey: 'post_id' });

User.hasMany(Comment, { foreignKey: 'author_id' });
Post.hasMany(Comment, { foreignKey: 'post_id' });
Comment.belongsTo(User, { foreignKey: 'author_id' });
Comment.belongsTo(Post, { foreignKey: 'post_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(QuizAnswer, { foreignKey: 'user_id' });
Post.hasMany(QuizAnswer, { foreignKey: 'post_id' });
QuizAnswer.belongsTo(User, { foreignKey: 'user_id' });
QuizAnswer.belongsTo(Post, { foreignKey: 'post_id' });

User.hasMany(Media, { foreignKey: 'owner_id' });
Media.belongsTo(User, { foreignKey: 'owner_id' });

module.exports = {
  sequelize,
  User,
  Post,
  PollVote,
  Group,
  GroupMember,
  Message,
  RewardHistory,
  RoleChangeLog,
  Like,
  Comment,
  Notification,
  QuizAnswer,
  Media,
};
