-- Study Planner schema (with accounts). Safe to run on an empty database.
-- To start over (this DELETES everything):
--   DROP TABLE deadlines, class_sessions, semester, courses, users CASCADE;
-- then run this file again, then run `npm run seed` in the api folder for the demo account.

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every course belongs to ONE user. Deadlines and classes belong to a course, so they belong to that user too.
-- ON DELETE CASCADE: deleting a user deletes their courses, and deleting a course deletes its deadlines and classes.
CREATE TABLE courses (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code    TEXT NOT NULL,
  title   TEXT NOT NULL,
  color   TEXT NOT NULL CHECK (color IN ('blue', 'green', 'orange', 'purple', 'teal', 'rose')),
  UNIQUE (user_id, code) -- the same code can be used by different users, but only once per user
);

CREATE INDEX courses_user_id_idx ON courses (user_id);

CREATE TABLE deadlines (
  id        SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  kind      TEXT NOT NULL CHECK (kind IN ('Assignment', 'Test', 'Exam', 'Project', 'Reading')),
  due_date  DATE NOT NULL,
  due_time  TEXT NOT NULL DEFAULT '' CHECK (due_time = '' OR due_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  done      BOOLEAN NOT NULL DEFAULT false,
  note      TEXT NOT NULL DEFAULT ''
);

CREATE INDEX deadlines_due_date_idx ON deadlines (due_date);
CREATE INDEX deadlines_course_id_idx ON deadlines (course_id);

-- A weekly class is a RULE: "this course meets on this weekday at these times".
CREATE TABLE class_sessions (
  id         SERIAL PRIMARY KEY,
  course_id  INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TEXT NOT NULL CHECK (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time   TEXT NOT NULL CHECK (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  room       TEXT NOT NULL DEFAULT '',
  CHECK (end_time > start_time)
);

CREATE INDEX class_sessions_course_id_idx ON class_sessions (course_id);

-- One row per user (the user id is the primary key).
CREATE TABLE semester (
  user_id    INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  CHECK (end_date > start_date)
);
