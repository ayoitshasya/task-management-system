// mongoSetup.js - MongoDB collection setup and index documentation
// This file is for reference only. Mongoose models auto-create collections.
// Run this file with: node config/mongoSetup.js (optional, for manual index creation)

const mongoose = require('mongoose');
require('dotenv').config();

/**
 * MongoDB Collections used by this application:
 *
 * 1. users
 *    - name         : String (required)
 *    - email        : String (required, unique)
 *    - password     : String (hashed with bcrypt)
 *    - role         : String ('admin' | 'user', default: 'user')
 *    - created_at   : Date (auto-managed by Mongoose timestamps)
 *
 * 2. tasks
 *    - title        : String (required)
 *    - description  : String
 *    - priority     : String ('Low' | 'Medium' | 'High', default: 'Medium')
 *    - status       : String ('Pending' | 'In Progress' | 'Completed', default: 'Pending')
 *    - due_date     : Date (required)
 *    - assigned_to  : ObjectId (ref: User)
 *    - created_by   : ObjectId (ref: User, required)
 *    - created_at   : Date (auto-managed)
 *    - updated_at   : Date (auto-managed)
 *
 * 3. notifications
 *    - user_id      : ObjectId (ref: User, required)
 *    - message      : String (required)
 *    - is_read      : Boolean (default: false)
 *    - created_at   : Date (default: now)
 *
 * 4. activitylogs
 *    - user_id      : ObjectId (ref: User)
 *    - action       : String (required)
 *    - created_at   : Date (default: now)
 */

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Users: unique index on email (also set in Mongoose schema)
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    // Tasks: index for quick lookup by assigned_to and created_by
    await db.collection('tasks').createIndex({ assigned_to: 1 });
    await db.collection('tasks').createIndex({ created_by: 1 });
    await db.collection('tasks').createIndex({ due_date: 1 });

    // Notifications: index for fetching unread notifications by user
    await db.collection('notifications').createIndex({ user_id: 1, is_read: 1 });

    // Activity logs: index for fetching logs by user
    await db.collection('activitylogs').createIndex({ user_id: 1 });

    console.log('All indexes created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Index creation error:', err);
    process.exit(1);
  }
};

createIndexes();
