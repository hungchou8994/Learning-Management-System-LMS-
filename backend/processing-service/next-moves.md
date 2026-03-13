Table User {
id uuid [primary key]
username varchar [unique, not null]
first_name varchar
last_name varchar
address varchar
dob date
bio text
phone_number varchar
avatar_url text
cover_url text
skill text
social_share text
}

Table AuthDB {
id uuid [primary key]
username varchar [unique, not null]
created_at timestamp [default: `now()`]
email varchar
role Role
}

enum Role {
student
parent
teacher
admin
manager
recruiter
accountant
}

Table Cart {
username varchar [unique, not null]
course_ids array
}

Table Enroll {
date date
status ErollStatus
payment_method PaymentMethod
progress int
username varchar
course_id uuid
}

enum ErollStatus {
paid
not_paid
}

enum PaymentMethod {
cash
bank
}

Table Feedback {
date date
rate int
comment text
title text
username varchar
course_id uuid
}

Table Course {
id uuit [primary key]
name text
short_description text
original_price float
sale_price float
thumbnail text
targets array
requirements array
session_ids array
certificate bool
level int
instructor_id uuid
tag text
}

Table Session {
id uuid [primary key]
name text
description text
order_index int
lessons array [note: "Lưu mảng các lesson trong này luôn"]
assignment_id uuid
}

// Store in lesssons attribute of Session table
Table Lesson {
id uuid [primary key]
title text
type LessonType
duration float
order_index int
video_url text [null, note: "Nullable"]
subtitle text [null, note: "Nullable"]
description text
}

enum LessonType {
video
document
online
}

Table Assignment {
id uuid [primary key]
name text
description text
ratio int
questions array [note: "Array of questions"]
}

Table Question {
id uuit [primary key]
title text
type QuestionType
order_index int
option1 text [null]
option2 text [null]
option3 text [null]
option4 text [null]
}

enum QuestionType {
multi_choice
assignment
}

Table Attempt {
username uuid
assignment_id uuid
grade float
instructor_id uuid
answers araay [note: "Array of student's answers"]
}

Relationship between tables:
Table A Table B Ratio Criteria Description

---

Auth-db User <--> User 1-1 A.username = B.username Connect processing-db with auth-db via username
User <--> Cart 1-1 A.username = B.username One user can have one cart
Cart <--> Course 1-n A.course_ids[].contains(B.uuid) One cart can contain many courses
User <--> Enroll 1-n A.username = B.username One user can enroll many courses
Enroll <--> Course n-1 A.course_id = B.uuid One course can have many enrollments
User <--> Feedback 1-n A.username = B.username One user can write many feedbacks
Feedback <--> Course n-1 A.course_id = B.uuid One course can get many feedbacks
Course <--> Session 1-n A.session_ids[].contains(B.uuid) One course can have many sessions
Session <--> Assignment 1-1 A.assignment_id = B.uuid One session have one assignment
User <--> Attempt 1-n A.username = B.username One user can have many attempt
Attempt <--> Assignment n-1 A.assignment_id = B.uuid One assignment can have many attemptions
