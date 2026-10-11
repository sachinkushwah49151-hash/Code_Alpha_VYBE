/**
 * VYBE Idempotent Community Seeder (Phase 1)
 * Usage: npm run seed   (or: node scripts/seed.js)
 *
 * Guarantees:
 * - Idempotent: running multiple times never creates duplicate users or posts.
 * - Safe: never overwrites or deletes real user accounts or real user-created posts.
 * - Dual-mode: upserts into MongoDB when reachable, and validates/seeds the local
 *   persistent seed state when running in resilient fallback mode.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Post = require('../models/Post');
const { SEED_USERS, SEED_POSTS } = require('../data/seedData');

const LEDGER_PATH = path.join(__dirname, '..', 'data', '.seed_ledger.json');

function loadLedger() {
  try {
    if (fs.existsSync(LEDGER_PATH)) {
      const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.posts)) {
        return parsed;
      }
    }
  } catch (err) {
    // ignore corrupt ledger
  }
  return { users: [], posts: [], lastSeededAt: null };
}

function saveLedger(ledger) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8');
}

async function runSeed() {
  console.log('==========================================================');
  console.log(' VYBE Community Seeder — Idempotent Social Network Seed');
  console.log('==========================================================');

  // 1. Validate dataset integrity & uniqueness before touching any store
  const usernameSet = new Set();
  const userIdSet = new Set();
  for (const u of SEED_USERS) {
    const uname = u.username.toLowerCase();
    const uid = u._id.toString();
    if (usernameSet.has(uname)) {
      throw new Error(`Duplicate username in seed dataset: ${uname}`);
    }
    if (userIdSet.has(uid)) {
      throw new Error(`Duplicate user _id in seed dataset: ${uid}`);
    }
    if (u.bio && u.bio.length > 160) {
      throw new Error(`Bio exceeds 160 chars for ${uname} (${u.bio.length} chars)`);
    }
    usernameSet.add(uname);
    userIdSet.add(uid);
  }

  const postIdSet = new Set();
  const seedKeySet = new Set();
  let totalComments = 0;
  let totalLikes = 0;
  for (const p of SEED_POSTS) {
    const pid = p._id.toString();
    if (postIdSet.has(pid)) {
      throw new Error(`Duplicate post _id in seed dataset: ${pid}`);
    }
    if (p.seedKey && seedKeySet.has(p.seedKey)) {
      throw new Error(`Duplicate post seedKey in seed dataset: ${p.seedKey}`);
    }
    postIdSet.add(pid);
    if (p.seedKey) seedKeySet.add(p.seedKey);
    totalComments += Array.isArray(p.comments) ? p.comments.length : 0;
    totalLikes += Array.isArray(p.likes) ? p.likes.length : 0;
  }

  console.log(`[Validation] Verified ${SEED_USERS.length} unique demo users and ${SEED_POSTS.length} unique demo posts.`);
  console.log(`[Validation] Total seeded likes: ${totalLikes} | Total seeded comments: ${totalComments}`);

  // 2. Attempt MongoDB connection if MONGO_URI is configured
  let mongoConnected = false;
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 4000,
      });
      mongoConnected = mongoose.connection.readyState === 1;
      console.log(`[MongoDB] Connected to ${mongoose.connection.host}`);
    } catch (err) {
      console.log(`[MongoDB] Atlas unreachable (${err.message.split('\n')[0]}). Using local idempotent seed store.`);
    }
  }

  let usersInserted = 0;
  let usersSkipped = 0;
  let postsInserted = 0;
  let postsSkipped = 0;

  if (mongoConnected) {
    // Upsert users idempotently via $setOnInsert (never overwrites existing or real users)
    for (const u of SEED_USERS) {
      const res = await User.updateOne(
        { $or: [{ _id: u._id }, { username: u.username }, { email: u.email }] },
        { $setOnInsert: u },
        { upsert: true }
      );
      if (res.upsertedCount && res.upsertedCount > 0) {
        usersInserted++;
      } else {
        usersSkipped++;
      }
    }

    // Upsert posts idempotently via $setOnInsert (never overwrites existing posts)
    for (const p of SEED_POSTS) {
      const res = await Post.updateOne(
        { $or: [{ _id: p._id }, { seedKey: p.seedKey }] },
        { $setOnInsert: p },
        { upsert: true }
      );
      if (res.upsertedCount && res.upsertedCount > 0) {
        postsInserted++;
      } else {
        postsSkipped++;
      }
    }

    const dbUserCount = await User.countDocuments();
    const dbPostCount = await Post.countDocuments();
    console.log(`[MongoDB Seed] Users — Inserted: ${usersInserted}, Existing/Skipped: ${usersSkipped}, Total in DB: ${dbUserCount}`);
    console.log(`[MongoDB Seed] Posts — Inserted: ${postsInserted}, Existing/Skipped: ${postsSkipped}, Total in DB: ${dbPostCount}`);
    await mongoose.disconnect();
  }

  // 3. Also synchronize local idempotent ledger for fallback mode verification
  const ledger = loadLedger();
  const existingUserSet = new Set(ledger.users);
  const existingPostSet = new Set(ledger.posts);

  let ledgerUsersAdded = 0;
  let ledgerUsersExisting = 0;
  for (const u of SEED_USERS) {
    const key = `${u._id.toString()}:${u.username}`;
    if (existingUserSet.has(key)) {
      ledgerUsersExisting++;
    } else {
      existingUserSet.add(key);
      ledgerUsersAdded++;
    }
  }

  let ledgerPostsAdded = 0;
  let ledgerPostsExisting = 0;
  for (const p of SEED_POSTS) {
    const key = p.seedKey || p._id.toString();
    if (existingPostSet.has(key)) {
      ledgerPostsExisting++;
    } else {
      existingPostSet.add(key);
      ledgerPostsAdded++;
    }
  }

  ledger.users = Array.from(existingUserSet);
  ledger.posts = Array.from(existingPostSet);
  ledger.lastSeededAt = new Date().toISOString();
  saveLedger(ledger);

  if (!mongoConnected) {
    usersInserted = ledgerUsersAdded;
    usersSkipped = ledgerUsersExisting;
    postsInserted = ledgerPostsAdded;
    postsSkipped = ledgerPostsExisting;
  }

  console.log('----------------------------------------------------------');
  console.log(` Users : ${usersInserted} newly seeded, ${usersSkipped} already present (Total active: ${SEED_USERS.length})`);
  console.log(` Posts : ${postsInserted} newly seeded, ${postsSkipped} already present (Total active: ${SEED_POSTS.length})`);
  console.log('==========================================================');
}

runSeed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
