const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const Enrollment = mongoose.connection.collection('enrollments');
  const Course = mongoose.connection.collection('courses');

  const enrolls = await Enrollment.find({}).toArray();
  console.log("Enrollments:", enrolls.length);

  for (const e of enrolls) {
    const courseIdStr = e.courseId ? e.courseId.toString() : 'null';
    console.log(`User: ${e.userId}, Course: ${courseIdStr}`);
  }

  const courses = await Course.find({}).toArray();
  for (const c of courses) {
    console.log(`Course: ${c._id.toString()}, Title: ${c.title}, Schedule: ${JSON.stringify(c.schedule)}`);
  }

  mongoose.disconnect();
}
run();
