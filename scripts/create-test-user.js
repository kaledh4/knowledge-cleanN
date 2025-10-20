import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'knowledge.db');
const db = new Database(dbPath);

async function createTestUser() {
  const email = 'test@example.com';
  const password = 'password';

  try {
    // Delete the user if they exist
    const deleteStmt = db.prepare('DELETE FROM users WHERE email = ?');
    const deleteResult = deleteStmt.run(email);
    if (deleteResult.changes > 0) {
      console.log('Existing test user deleted.');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user
    const stmt = db.prepare('INSERT INTO users (id, email, encrypted_password, name) VALUES (?, ?, ?, ?)');
    stmt.run(uuidv4(), email, hashedPassword, 'Test User');

    console.log('Test user created successfully.');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    db.close();
  }
}

createTestUser();