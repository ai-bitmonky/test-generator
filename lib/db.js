// Simple file-based database
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'lib/data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TESTS_FILE = path.join(DATA_DIR, 'tests.json');

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(TESTS_FILE)) {
  fs.writeFileSync(TESTS_FILE, JSON.stringify([]));
}

export function getUsers() {
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

export function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getTests() {
  const data = fs.readFileSync(TESTS_FILE, 'utf8');
  return JSON.parse(data);
}

export function saveTests(tests) {
  fs.writeFileSync(TESTS_FILE, JSON.stringify(tests, null, 2));
}

export function getUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email === email);
}

export function createUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

export function getTestsByUserId(userId) {
  const tests = getTests();
  return tests.filter(t => t.userId === userId);
}

export function createTest(test) {
  const tests = getTests();
  tests.push(test);
  saveTests(tests);
  return test;
}
