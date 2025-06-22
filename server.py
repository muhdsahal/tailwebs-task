import http.server
import socketserver
import json
import urllib.parse
import os
from database import Database

class TeacherPortalHandler(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.db = Database()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/' or self.path == '/login':
            self.serve_file('templates/login.html')
        elif self.path == '/dashboard':
            self.serve_file('templates/dashboard.html')
        elif self.path.startswith('/static/'):
            self.serve_static_file(self.path[8:])  
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        if self.path == '/api/login':
            self.handle_login(post_data)
        elif self.path == '/api/students':
            self.handle_get_students(post_data)
        elif self.path == '/api/add_student':
            self.handle_add_student(post_data)
        elif self.path == '/api/update_student':
            self.handle_update_student(post_data)
        elif self.path == '/api/delete_student':
            self.handle_delete_student(post_data)
        else:
            self.send_error(404)
    
    def serve_file(self, filepath):
        """Serve HTML files"""
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404)
    
    def serve_static_file(self, filepath):
        """Serve static files (CSS, JS)"""
        try:
            full_path = os.path.join('static', filepath)
            with open(full_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            self.send_response(200)
            if filepath.endswith('.css'):
                self.send_header('Content-type', 'text/css')
            elif filepath.endswith('.js'):
                self.send_header('Content-type', 'text/javascript')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404)
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def handle_login(self, post_data):
        """Handle teacher login"""
        try:
            data = json.loads(post_data)
            username = data.get('username')
            password = data.get('password')
            
            teacher = self.db.authenticate_teacher(username, password)
            
            if teacher:
                self.send_json_response({
                    'success': True,
                    'teacher': teacher,
                    'message': 'Login successful'
                })
            else:
                self.send_json_response({
                    'success': False,
                    'message': 'Invalid username or password'
                }, 401)
        
        except Exception as e:
            self.send_json_response({
                'success': False,
                'message': f'Login error: {str(e)}'
            }, 500)
    
    def handle_get_students(self, post_data):
        """Get students for a teacher"""
        try:
            data = json.loads(post_data)
            teacher_id = data.get('teacher_id')
            
            students = self.db.get_students(teacher_id)
            
            self.send_json_response({
                'success': True,
                'students': students
            })
        
        except Exception as e:
            self.send_json_response({
                'success': False,
                'message': f'Error fetching students: {str(e)}'
            }, 500)
    
    def handle_add_student(self, post_data):
        """Add or update student"""
        try:
            data = json.loads(post_data)
            name = data.get('name')
            subject = data.get('subject')
            marks = int(data.get('marks'))
            teacher_id = data.get('teacher_id')
            
            message = self.db.add_or_update_student(name, subject, marks, teacher_id)
            
            self.send_json_response({
                'success': True,
                'message': message
            })
        
        except Exception as e:
            self.send_json_response({
                'success': False,
                'message': f'Error adding student: {str(e)}'
            }, 500)
    
    def handle_update_student(self, post_data):
        """Update student details"""
        try:
            data = json.loads(post_data)
            student_id = data.get('student_id')
            name = data.get('name')
            subject = data.get('subject')
            marks = int(data.get('marks'))
            
            message = self.db.update_student(student_id, name, subject, marks)
            
            self.send_json_response({
                'success': True,
                'message': message
            })
        
        except Exception as e:
            self.send_json_response({
                'success': False,
                'message': f'Error updating student: {str(e)}'
            }, 500)
    
    def handle_delete_student(self, post_data):
        """Delete student"""
        try:
            data = json.loads(post_data)
            student_id = data.get('student_id')
            
            message = self.db.delete_student(student_id)
            
            self.send_json_response({
                'success': True,
                'message': message
            })
        
        except Exception as e:
            self.send_json_response({
                'success': False,
                'message': f'Error deleting student: {str(e)}'
            }, 500)

def run_server(port=8000):
    """Run the server"""
    with socketserver.TCPServer(("", port), TeacherPortalHandler) as httpd:
        print(f"Server running at http://localhost:{port}")
        print("Default login - Username: admin, Password: admin123")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()