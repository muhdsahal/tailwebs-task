import sqlite3
import hashlib
import os

class Database:
    def __init__(self, db_name='teacher_portal.db'):
        self.db_name = db_name
        self.init_database()
    
    def get_connection(self):
        return sqlite3.connect(self.db_name)
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                subject TEXT NOT NULL,
                marks INTEGER NOT NULL,
                teacher_id INTEGER,
                FOREIGN KEY (teacher_id) REFERENCES teachers (id),
                UNIQUE(name, subject, teacher_id)
            )
        ''')
        
        
        cursor.execute('SELECT COUNT(*) FROM teachers WHERE username = ?', ('admin',))
        if cursor.fetchone()[0] == 0:
            hashed_password = hashlib.sha256('admin123'.encode()).hexdigest()
            cursor.execute('''
                INSERT INTO teachers (username, password, name) 
                VALUES (?, ?, ?)
            ''', ('admin', hashed_password, 'Admin Teacher'))
        
        conn.commit()
        conn.close()
    
    def authenticate_teacher(self, username, password):
        """Authenticate teacher login"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        cursor.execute('''
            SELECT id, name FROM teachers 
            WHERE username = ? AND password = ?
        ''', (username, hashed_password))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {'id': result[0], 'name': result[1]}
        return None
    
    def get_students(self, teacher_id):
        """Get all students for a teacher"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, subject, marks 
            FROM students 
            WHERE teacher_id = ?
            ORDER BY name, subject
        ''', (teacher_id,))
        
        students = []
        for row in cursor.fetchall():
            students.append({
                'id': row[0],
                'name': row[1],
                'subject': row[2],
                'marks': row[3]
            })
        
        conn.close()
        return students
    
    def add_or_update_student(self, name, subject, marks, teacher_id):
        """Add or update student - FIXED VERSION"""
        print(f"DEBUG: Adding student - Name: {name}, Subject: {subject}, Marks: {marks}")

        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            name_normalized = name.strip().lower()
            subject_normalized = subject.strip().lower()
            
            name_display = name.strip().title()  
            subject_display = subject.strip().title()  
            
            cursor.execute('''
                SELECT id FROM students 
                WHERE LOWER(TRIM(name)) = ? AND LOWER(TRIM(subject)) = ? AND teacher_id = ?
            ''', (name_normalized, subject_normalized, teacher_id))
            
            existing_student = cursor.fetchone()
            
            if existing_student:
                cursor.execute('''
                    UPDATE students SET marks = ? 
                    WHERE id = ?
                ''', (marks, existing_student[0]))
                
                conn.commit()
                conn.close()
                return "Student updated successfully."
            else:
                cursor.execute('''
                    INSERT INTO students (name, subject, marks, teacher_id) 
                    VALUES (?, ?, ?, ?)
                ''', (name_display, subject_display, marks, teacher_id))
                
                conn.commit()
                conn.close()
                return "Student added successfully."
            
        except Exception as e:
            conn.rollback()
            conn.close()
            raise e


    
    def update_student(self, student_id, name, subject, marks):
        """Update student details"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE students 
            SET name = ?, subject = ?, marks = ? 
            WHERE id = ?
        ''', (name, subject, marks, student_id))
        
        conn.commit()
        conn.close()
        return "Student updated successfully"
    
    def delete_student(self, student_id):
        """Delete a student"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM students WHERE id = ?', (student_id,))
        
        conn.commit()
        conn.close()
        return "Student deleted successfully"
