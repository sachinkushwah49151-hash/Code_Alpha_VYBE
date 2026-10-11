/**
 * VYBE Phase 3: Comprehensive Authentication Verification Suite
 * Tests authentication logic, security controls, token lifecycle, and DB interaction.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const { protect } = require('./middleware/authMiddleware');
const { registerUser, loginUser, getMe } = require('./controllers/authController');
const { app } = require('./server');

const results = [];

function recordResult(testName, passed, details) {
  results.push({ testName, passed, details });
  const symbol = passed === true ? '✅ PASS' : (passed === null ? 'ℹ️ SKIP' : '❌ FAIL');
  console.log(`${symbol} - ${testName}: ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Running VYBE Phase 3 Authentication Test Suite');
  console.log('====================================================\n');

  // ----------------------------------------------------------------
  // Test 1: Password Hashing with bcryptjs
  // ----------------------------------------------------------------
  try {
    const plainPassword = 'SuperSecretPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    const isBcryptHash = hash.startsWith('$2a$') || hash.startsWith('$2b$');
    const matchesCorrect = await bcrypt.compare(plainPassword, hash);
    const rejectsWrong = !(await bcrypt.compare('WrongPassword', hash));

    const passed = isBcryptHash && matchesCorrect && rejectsWrong && hash !== plainPassword;
    recordResult(
      'Password Hashing & Comparison (bcryptjs)',
      passed,
      `Hash prefix: ${hash.substring(0, 7)}, length: ${hash.length}, correct pass: ${matchesCorrect}, wrong pass: ${rejectsWrong}`
    );
  } catch (err) {
    recordResult('Password Hashing & Comparison (bcryptjs)', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 2: JWT Token Generation & Verification
  // ----------------------------------------------------------------
  try {
    const secret = process.env.JWT_SECRET || 'test_secret';
    const payload = { id: 'usr_test123', username: 'testuser' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, secret);
    const valid = decoded.id === payload.id && decoded.username === payload.username;

    recordResult(
      'JWT Token Lifecycle (Generation & Verification)',
      valid,
      `Decoded id: ${decoded.id}, username: ${decoded.username}, expiry: ${new Date(decoded.exp * 1000).toISOString()}`
    );
  } catch (err) {
    recordResult('JWT Token Lifecycle (Generation & Verification)', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 3: Expired Token Rejection
  // ----------------------------------------------------------------
  try {
    const secret = process.env.JWT_SECRET || 'test_secret';
    // Sign an immediately expired token
    const expiredToken = jwt.sign({ id: 'usr_expired' }, secret, { expiresIn: '-1s' });

    let expiredErrorCaught = false;
    try {
      jwt.verify(expiredToken, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        expiredErrorCaught = true;
      }
    }

    recordResult(
      'Expired Token Detection',
      expiredErrorCaught,
      'jwt.verify cleanly threw TokenExpiredError'
    );
  } catch (err) {
    recordResult('Expired Token Detection', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 4: Auth Middleware - Missing Token Rejection (HTTP 401)
  // ----------------------------------------------------------------
  try {
    const req = { headers: {} };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => {
            jsonSent = data;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await protect(req, res, next);

    const passed = statusSent === 401 && !nextCalled && jsonSent && jsonSent.success === false;
    recordResult(
      'Auth Middleware: Missing Token Rejection',
      passed,
      `Returned HTTP ${statusSent}, message: "${jsonSent?.message}", nextCalled: ${nextCalled}`
    );
  } catch (err) {
    recordResult('Auth Middleware: Missing Token Rejection', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 5: Auth Middleware - Invalid/Malformed Token Rejection (HTTP 401)
  // ----------------------------------------------------------------
  try {
    const req = { headers: { authorization: 'Bearer completely_bogus_token_xyz' } };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => {
            jsonSent = data;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await protect(req, res, next);

    const passed = statusSent === 401 && !nextCalled && jsonSent && jsonSent.success === false;
    recordResult(
      'Auth Middleware: Invalid Token Rejection',
      passed,
      `Returned HTTP ${statusSent}, message: "${jsonSent?.message}", nextCalled: ${nextCalled}`
    );
  } catch (err) {
    recordResult('Auth Middleware: Invalid Token Rejection', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 6: Registration Input Validation (Missing Fields, Invalid Formats)
  // ----------------------------------------------------------------
  try {
    const testCases = [
      { body: {}, expectedMsg: 'required fields' },
      { body: { name: '', username: 'abc', email: 'a@b.com', password: '123456' }, expectedMsg: 'Name' },
      { body: { name: 'Valid Name', username: 'ab', email: 'a@b.com', password: '123456' }, expectedMsg: 'Username' },
      { body: { name: 'Valid Name', username: 'valid_user', email: 'not-an-email', password: '123456' }, expectedMsg: 'valid email' },
      { body: { name: 'Valid Name', username: 'valid_user', email: 'a@b.com', password: '123' }, expectedMsg: 'at least 6 characters' },
    ];

    let allPassed = true;
    for (const tc of testCases) {
      let statusSent = null;
      let jsonSent = null;
      const req = { body: tc.body };
      const res = {
        status: (code) => {
          statusSent = code;
          return { json: (data) => { jsonSent = data; } };
        },
      };

      await registerUser(req, res);
      if (statusSent !== 400 || !jsonSent || jsonSent.success !== false) {
        allPassed = false;
        break;
      }
    }

    recordResult(
      'Registration Input Validation Guardrails',
      allPassed,
      'Rejected all 5 invalid input variations with HTTP 400 before DB invocation'
    );
  } catch (err) {
    recordResult('Registration Input Validation Guardrails', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 7: Login Input Validation (Missing Email/Password)
  // ----------------------------------------------------------------
  try {
    let statusSent = null;
    let jsonSent = null;
    const req = { body: { email: '' } };
    const res = {
      status: (code) => {
        statusSent = code;
        return { json: (data) => { jsonSent = data; } };
      },
    };

    await loginUser(req, res);
    const passed = statusSent === 400 && jsonSent && jsonSent.success === false;
    recordResult(
      'Login Input Validation Guardrails',
      passed,
      `Missing password returned HTTP ${statusSent}: "${jsonSent?.message}"`
    );
  } catch (err) {
    recordResult('Login Input Validation Guardrails', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 8: Password Hash Redaction in User Model & Serialization
  // ----------------------------------------------------------------
  try {
    const dummyUser = new User({
      name: 'Maya Lin',
      username: 'mayalin',
      email: 'maya@example.com',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklm',
    });

    const jsonOutput = dummyUser.toJSON();
    const objectOutput = dummyUser.toObject();

    const noPasswordInJSON = !('password' in jsonOutput);
    const noPasswordInObject = !('password' in objectOutput);

    const passed = noPasswordInJSON && noPasswordInObject;
    recordResult(
      'Password Hash Redaction in API Serialization',
      passed,
      `toJSON has password: ${!noPasswordInJSON}, toObject has password: ${!noPasswordInObject}`
    );
  } catch (err) {
    recordResult('Password Hash Redaction in API Serialization', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 9: Live MongoDB Connectivity & End-to-End Registration/Login
  // ----------------------------------------------------------------
  console.log('\n--- Checking Database-Dependent Operations ---');
  let dbAvailable = false;
  try {
    // Attempt DB connection using connectDB
    const connectDB = require('./config/db');
    await connectDB();
    dbAvailable = mongoose.connection.readyState === 1;
  } catch (dbErr) {
    dbAvailable = false;
  }

  if (dbAvailable) {
    console.log('⚡ Connected to MongoDB! Executing Live Database Tests...');
    try {
      const testEmail = `test_${Date.now()}@example.com`;
      const testUsername = `user_${Date.now()}`;
      const testPassword = 'Password123!';

      // 9a. Live Register
      let regStatus = null;
      let regBody = null;
      const regReq = { body: { name: 'Live Tester', username: testUsername, email: testEmail, password: testPassword } };
      const regRes = {
        status: (c) => { regStatus = c; return { json: (d) => { regBody = d; } }; },
      };
      await registerUser(regReq, regRes);

      const regOk = regStatus === 201 && regBody.token && !('password' in regBody.user);
      recordResult('Live Database Registration', regOk, `Registered user ${testUsername}, token issued`);

      // 9b. Verify DB Stored Hash, not Plaintext
      const savedUserInDb = await User.findById(regBody.user._id).select('+password');
      const isHashInDb = savedUserInDb.password.startsWith('$2') && savedUserInDb.password !== testPassword;
      recordResult('Live DB Password Storage', isHashInDb, `Stored in DB as bcrypt hash: ${savedUserInDb.password.substring(0, 10)}...`);

      // 9c. Duplicate Rejection
      let dupStatus = null;
      let dupBody = null;
      const dupReq = { body: { name: 'Duplicate Tester', username: testUsername, email: testEmail, password: testPassword } };
      const dupRes = {
        status: (c) => { dupStatus = c; return { json: (d) => { dupBody = d; } }; },
      };
      await registerUser(dupReq, dupRes);
      const dupOk = dupStatus === 400 && dupBody.success === false;
      recordResult('Live Duplicate Rejection', dupOk, `Duplicate registration rejected with HTTP ${dupStatus}: "${dupBody.message}"`);

      // 9d. Live Login
      let loginStatus = null;
      let loginBody = null;
      const loginReq = { body: { email: testEmail, password: testPassword } };
      const loginRes = {
        status: (c) => { loginStatus = c; return { json: (d) => { loginBody = d; } }; },
      };
      await loginUser(loginReq, loginRes);
      const loginOk = loginStatus === 200 && loginBody.token && !('password' in loginBody.user);
      recordResult('Live Database Login', loginOk, `Logged in successfully, token issued`);

      // 9e. Live Login Wrong Password
      let badLoginStatus = null;
      let badLoginBody = null;
      const badLoginReq = { body: { email: testEmail, password: 'WrongPassword' } };
      const badLoginRes = {
        status: (c) => { badLoginStatus = c; return { json: (d) => { badLoginBody = d; } }; },
      };
      await loginUser(badLoginReq, badLoginRes);
      const badLoginOk = badLoginStatus === 401 && badLoginBody.success === false;
      recordResult('Live Incorrect Password Rejection', badLoginOk, `Rejected with HTTP ${badLoginStatus}: "${badLoginBody.message}"`);

      // 9f. Live GET /api/auth/me with Token
      let meStatus = null;
      let meBody = null;
      const meReq = { headers: { authorization: `Bearer ${loginBody.token}` } };
      const meRes = {
        status: (c) => { meStatus = c; return { json: (d) => { meBody = d; } }; },
      };
      await protect(meReq, meRes, async () => {
        await getMe(meReq, meRes);
      });
      const meOk = meStatus === 200 && meBody.user && meBody.user.email === testEmail;
      recordResult('Live GET /api/auth/me with Bearer Token', meOk, `Retrieved profile for ${meBody.user.username}`);

      // Clean up test document
      await User.findByIdAndDelete(regBody.user._id);
    } catch (liveErr) {
      recordResult('Live Database Operations', false, liveErr.message);
    }
  } else {
    console.log('ℹ️ MongoDB is currently offline / unreachable.');
    console.log('ℹ️ As instructed: Do not claim database-dependent tests passed if MongoDB is unavailable.');
    recordResult(
      'Live Database Operations (Registration/Login/Me)',
      null,
      'SKIPPED (No live MongoDB instance running. Ready to run immediately once MongoDB is online).'
    );
  }

  console.log('\n====================================================');
  console.log('📊 Test Suite Summary:');
  const passedCount = results.filter(r => r.passed === true).length;
  const skippedCount = results.filter(r => r.passed === null).length;
  const failedCount = results.filter(r => r.passed === false).length;
  console.log(`Passed: ${passedCount} | Skipped (Pending DB): ${skippedCount} | Failed: ${failedCount}`);
  console.log('====================================================');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

runTests();
