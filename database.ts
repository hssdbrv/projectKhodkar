import * as SQLite from 'expo-sqlite';

export interface User { id: number; firstName: string; lastName: string; responsibility: string; }
export interface AttendanceRecord { 
  id: number; 
  title: string; 
  date: string; 
  presentCount: number; 
  absentCount: number; 
}
export interface AttendanceDetail {
  firstName: string;
  lastName: string;
  status: string;
}

const db = SQLite.openDatabaseSync('office_management.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, firstName TEXT, lastName TEXT, responsibility TEXT);
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      userId INTEGER, 
      title TEXT, 
      date TEXT, 
      status TEXT
    );
  `);
};

export const addUser = (fName: string, lName: string, resp: string) => {
  db.runSync('INSERT INTO users (firstName, lastName, responsibility) VALUES (?, ?, ?)', [fName, lName, resp]);
};

export const getUsersFromDB = (): User[] => db.getAllSync<User>('SELECT * FROM users');

export const updateUser = (id: number, fName: string, lName: string, resp: string) => {
  db.runSync('UPDATE users SET firstName = ?, lastName = ?, responsibility = ? WHERE id = ?', [fName, lName, resp, id]);
};

export const deleteUser = (id: number) => {
  db.runSync('DELETE FROM users WHERE id = ?', [id]);
};

export const saveAttendanceReport = (title: string, presentIds: number[], allUsers: User[]) => {
  const today = new Date().toLocaleDateString('fa-IR');
  allUsers.forEach(user => {
    const isPresent = presentIds.includes(user.id);
    db.runSync('INSERT INTO attendance (userId, title, date, status) VALUES (?, ?, ?, ?)', 
      [user.id, title, today, isPresent ? 'حاضر' : 'منفک']);
  });
};

// دریافت لیست خلاصه آمارها برای صفحه سوابق
export const getHistoryGroups = (): AttendanceRecord[] => {
  return db.getAllSync<AttendanceRecord>(`
    SELECT id, title, date, 
    SUM(CASE WHEN status = 'حاضر' THEN 1 ELSE 0 END) as presentCount,
    SUM(CASE WHEN status = 'منفک' THEN 1 ELSE 0 END) as absentCount
    FROM attendance 
    GROUP BY title, date 
    ORDER BY id DESC
  `);
};

// دریافت جزئیات یک آمار خاص
export const getAttendanceDetails = (title: string, date: string): AttendanceDetail[] => {
  return db.getAllSync<AttendanceDetail>(`
    SELECT users.firstName, users.lastName, attendance.status 
    FROM attendance 
    JOIN users ON attendance.userId = users.id 
    WHERE attendance.title = ? AND attendance.date = ?
  `, [title, date]);
};
