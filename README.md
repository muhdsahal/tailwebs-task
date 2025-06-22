👨‍🏫 Teacher Portal – Student Management System
A robust and scalable web-based Teacher Portal for managing student data, built using Python (for the backend) and Vanilla HTML, CSS & JavaScript (for the frontend).

📌 Features
🔐 Login Functionality
Secure teacher login screen with credential verification.

Authentication via a backend database.

Feedback for incorrect login attempts.

🏠 Teacher Home & Student Listing
Displays a list of all students after successful login.

Shows Name, Subject, and Marks.

Inline editing and deletion of student details.

➕ Add New Students
Add new student records via a modal popup.

If a student with the same name and subject exists, their marks are updated.

Otherwise, a new student record is created.

🛠️ Technologies Used
🔧 Backend
Python 3

SQLite or any preferred DB (can be swapped easily)

Flask (for routing and server management)

🌐 Frontend
HTML5 & CSS3


🚀 Installation & Setup
1. Clone the Repository

git clone https://github.com/your-username/teacher-portal.git
cd teacher-portal
 # On Windows use venv\Scripts\activate
2. Install Dependencies
pip install -r requirements.txt
3. Run the Application
python server.py
Visit: http://localhost:8000

🗃️ Project Structure
teacher-portal/
│
├── static/
│   ├── styles.css
│   └── script.js
│
├── templates/
│   ├── login.html
│   └── dashboard.html
│
│
├── server.py
├── database.py
├── requirements.txt
└── README.md

💡 Future Enhancements

Role-based access for admins and teachers.

🙋‍♂️ Author
Muhammed Sahal

