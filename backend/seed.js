// ─────────────────────────────────────────────────────
//  seed.js  —  Insert 30 Faculty + 80 Students
// ─────────────────────────────────────────────────────
require('dotenv').config();
const pool = require('./db');

// ── Departments ───────────────────────────────────────
const depts = ['CSE', 'ECE', 'MECH', 'CIVIL', 'MBA'];

// ── Faculty data (30 records) ─────────────────────────
const facultyList = [
  { first: 'Arjun',     last: 'Sharma',     dept: 'CSE',   role: 'Professor',        gender: 'Male',   mobile: '9876543201', email: 'arjun.sharma@ecap.edu',     city: 'Hyderabad',  qual: 'PhD',  spec: 'Machine Learning',        exp: 12 },
  { first: 'Priya',     last: 'Reddy',      dept: 'CSE',   role: 'Associate Professor', gender: 'Female', mobile: '9876543202', email: 'priya.reddy@ecap.edu',      city: 'Bangalore',  qual: 'PhD',  spec: 'Data Structures',         exp: 9  },
  { first: 'Kiran',     last: 'Kumar',      dept: 'CSE',   role: 'Assistant Professor', gender: 'Male',   mobile: '9876543203', email: 'kiran.kumar@ecap.edu',      city: 'Chennai',    qual: 'MTech', spec: 'Computer Networks',      exp: 6  },
  { first: 'Sneha',     last: 'Patel',      dept: 'CSE',   role: 'Assistant Professor', gender: 'Female', mobile: '9876543204', email: 'sneha.patel@ecap.edu',      city: 'Pune',       qual: 'MTech', spec: 'Cyber Security',         exp: 5  },
  { first: 'Rahul',     last: 'Verma',      dept: 'CSE',   role: 'Assistant Professor', gender: 'Male',   mobile: '9876543205', email: 'rahul.verma@ecap.edu',      city: 'Delhi',      qual: 'MTech', spec: 'Artificial Intelligence',  exp: 4  },
  { first: 'Deepa',     last: 'Nair',       dept: 'CSE',   role: 'Lecturer',           gender: 'Female', mobile: '9876543206', email: 'deepa.nair@ecap.edu',       city: 'Kochi',      qual: 'MTech', spec: 'Web Technologies',       exp: 3  },
  { first: 'Suresh',    last: 'Babu',       dept: 'ECE',   role: 'Professor',           gender: 'Male',   mobile: '9876543207', email: 'suresh.babu@ecap.edu',      city: 'Hyderabad',  qual: 'PhD',  spec: 'Signal Processing',       exp: 15 },
  { first: 'Lakshmi',   last: 'Devi',       dept: 'ECE',   role: 'Associate Professor', gender: 'Female', mobile: '9876543208', email: 'lakshmi.devi@ecap.edu',     city: 'Vijayawada', qual: 'PhD',  spec: 'VLSI Design',             exp: 10 },
  { first: 'Ramesh',    last: 'Chandra',    dept: 'ECE',   role: 'Assistant Professor', gender: 'Male',   mobile: '9876543209', email: 'ramesh.chandra@ecap.edu',   city: 'Tirupati',   qual: 'MTech', spec: 'Embedded Systems',       exp: 7  },
  { first: 'Anusha',    last: 'Rao',        dept: 'ECE',   role: 'Assistant Professor', gender: 'Female', mobile: '9876543210', email: 'anusha.rao@ecap.edu',       city: 'Guntur',     qual: 'MTech', spec: 'Communication Systems',  exp: 5  },
  { first: 'Nagaraju',  last: 'Pillai',     dept: 'ECE',   role: 'Assistant Professor', gender: 'Male',   mobile: '9876543211', email: 'nagaraju.pillai@ecap.edu',  city: 'Kakinada',   qual: 'MTech', spec: 'Antenna Design',         exp: 4  },
  { first: 'Kavitha',   last: 'Srinivasan', dept: 'ECE',   role: 'Lecturer',           gender: 'Female', mobile: '9876543212', email: 'kavitha.srinivasan@ecap.edu', city: 'Nellore',  qual: 'BE',   spec: 'Digital Electronics',     exp: 2  },
  { first: 'Venkat',    last: 'Rao',        dept: 'MECH',  role: 'Professor',           gender: 'Male',   mobile: '9876543213', email: 'venkat.rao@ecap.edu',       city: 'Hyderabad',  qual: 'PhD',  spec: 'Thermodynamics',         exp: 18 },
  { first: 'Madhavi',   last: 'Latha',      dept: 'MECH',  role: 'Associate Professor', gender: 'Female', mobile: '9876543214', email: 'madhavi.latha@ecap.edu',    city: 'Vizag',      qual: 'PhD',  spec: 'CAD/CAM',                exp: 11 },
  { first: 'Sridhar',   last: 'Reddy',      dept: 'MECH',  role: 'Assistant Professor', gender: 'Male',   mobile: '9876543215', email: 'sridhar.reddy@ecap.edu',    city: 'Warangal',   qual: 'MTech', spec: 'Manufacturing',          exp: 7  },
  { first: 'Padmaja',   last: 'Singh',      dept: 'MECH',  role: 'Assistant Professor', gender: 'Female', mobile: '9876543216', email: 'padmaja.singh@ecap.edu',    city: 'Karimnagar', qual: 'MTech', spec: 'Robotics',               exp: 5  },
  { first: 'Rajesh',    last: 'Malhotra',   dept: 'MECH',  role: 'Assistant Professor', gender: 'Male',   mobile: '9876543217', email: 'rajesh.malhotra@ecap.edu',  city: 'Khammam',    qual: 'MTech', spec: 'Fluid Mechanics',        exp: 4  },
  { first: 'Usha',      last: 'Rani',       dept: 'MECH',  role: 'Lecturer',           gender: 'Female', mobile: '9876543218', email: 'usha.rani@ecap.edu',        city: 'Nizamabad',  qual: 'MTech', spec: 'Materials Science',      exp: 3  },
  { first: 'Prasad',    last: 'Naidu',      dept: 'CIVIL', role: 'Professor',           gender: 'Male',   mobile: '9876543219', email: 'prasad.naidu@ecap.edu',     city: 'Hyderabad',  qual: 'PhD',  spec: 'Structural Engineering',  exp: 20 },
  { first: 'Swapna',    last: 'Joshi',      dept: 'CIVIL', role: 'Associate Professor', gender: 'Female', mobile: '9876543220', email: 'swapna.joshi@ecap.edu',     city: 'Nagpur',     qual: 'PhD',  spec: 'Geotechnical Engineering', exp: 13 },
  { first: 'Anil',      last: 'Tiwari',     dept: 'CIVIL', role: 'Assistant Professor', gender: 'Male',   mobile: '9876543221', email: 'anil.tiwari@ecap.edu',      city: 'Indore',     qual: 'MTech', spec: 'Transportation',         exp: 8  },
  { first: 'Bindu',     last: 'Mehra',      dept: 'CIVIL', role: 'Assistant Professor', gender: 'Female', mobile: '9876543222', email: 'bindu.mehra@ecap.edu',      city: 'Bhopal',     qual: 'MTech', spec: 'Environmental Engg',     exp: 6  },
  { first: 'Sunil',     last: 'Sharma',     dept: 'CIVIL', role: 'Assistant Professor', gender: 'Male',   mobile: '9876543223', email: 'sunil.sharma@ecap.edu',     city: 'Lucknow',    qual: 'MTech', spec: 'Hydraulics',             exp: 5  },
  { first: 'Rekha',     last: 'Iyer',       dept: 'CIVIL', role: 'Lecturer',           gender: 'Female', mobile: '9876543224', email: 'rekha.iyer@ecap.edu',       city: 'Coimbatore', qual: 'BE',   spec: 'Surveying',              exp: 2  },
  { first: 'Mohan',     last: 'Das',        dept: 'MBA',   role: 'Professor',           gender: 'Male',   mobile: '9876543225', email: 'mohan.das@ecap.edu',        city: 'Hyderabad',  qual: 'PhD',  spec: 'Finance & Banking',       exp: 16 },
  { first: 'Anitha',    last: 'Krishnan',   dept: 'MBA',   role: 'Associate Professor', gender: 'Female', mobile: '9876543226', email: 'anitha.krishnan@ecap.edu',  city: 'Chennai',    qual: 'PhD',  spec: 'Marketing',              exp: 10 },
  { first: 'Sanjay',    last: 'Gupta',      dept: 'MBA',   role: 'Assistant Professor', gender: 'Male',   mobile: '9876543227', email: 'sanjay.gupta@ecap.edu',     city: 'Mumbai',     qual: 'MBA',  spec: 'HR Management',          exp: 7  },
  { first: 'Leela',     last: 'Mishra',     dept: 'MBA',   role: 'Assistant Professor', gender: 'Female', mobile: '9876543228', email: 'leela.mishra@ecap.edu',     city: 'Kolkata',    qual: 'MBA',  spec: 'Operations Management',   exp: 5  },
  { first: 'Vamsi',     last: 'Krishna',    dept: 'MBA',   role: 'Assistant Professor', gender: 'Male',   mobile: '9876543229', email: 'vamsi.krishna@ecap.edu',    city: 'Hyderabad',  qual: 'MBA',  spec: 'Business Analytics',     exp: 4  },
  { first: 'Hema',      last: 'Latha',      dept: 'MBA',   role: 'Lecturer',           gender: 'Female', mobile: '9876543230', email: 'hema.latha@ecap.edu',       city: 'Vijayawada', qual: 'MBA',  spec: 'Entrepreneurship',       exp: 3  },
];

// ── Student data (80 records) ─────────────────────────
const firstNames = [
  'Aarav','Aditya','Akash','Anand','Aryan','Ashok','Bharat','Chetan','Deepak','Farhan',
  'Ganesh','Harsh','Ishan','Jai','Kartik','Lokesh','Manish','Nishant','Om','Pranav',
  'Sahil','Tarun','Uday','Varun','Yash','Zaid','Nikhil','Rohit','Sameer','Tejas',
  'Aarti','Ananya','Ankita','Bhavna','Divya','Esha','Falguni','Geeta','Hina','Ishita',
  'Jyoti','Kaveri','Lalitha','Meena','Neha','Pooja','Ritu','Smita','Tanu','Uma',
  'Vani','Yamini','Zara','Priya','Sneha','Rekha','Pallavi','Nisha','Madhuri','Leela',
  'Arjun','Bala','Charan','Durga','Eswar','Gopal','Hari','Indra','Jagan','Kiran',
  'Lakshman','Mani','Naresh','Obul','Pavan','Ravi','Suresh','Tulasi','Umesh','Vinay'
];
const lastNames = [
  'Reddy','Kumar','Sharma','Rao','Naidu','Patel','Verma','Singh','Nair','Pillai',
  'Babu','Chandra','Devi','Latha','Raju','Krishna','Varma','Murthy','Prasad','Goud'
];
const cities = ['Hyderabad','Vijayawada','Visakhapatnam','Warangal','Tirupati','Guntur','Nellore','Karimnagar','Kakinada','Rajahmundry'];
const sections = ['A','B','C'];
const currentYears = ['1st Year','2nd Year','3rd Year','4th Year'];
const deptsList = ['CSE','ECE','MECH','CIVIL','MBA'];

const students = [];
let rollCounter = 1;

for (let i = 0; i < 80; i++) {
  const dept = deptsList[i % deptsList.length];
  const admYear = 2020 + Math.floor(i / 20);
  const currYear = currentYears[i % 4];
  const section = sections[i % 3];
  const rollNo = `${dept}${admYear}${String(rollCounter++).padStart(3,'0')}`;
  const dob = `${1999 + (i % 5)}-${String((i % 12) + 1).padStart(2,'0')}-${String((i % 28) + 1).padStart(2,'0')}`;
  const fn = firstNames[i];
  const ln = lastNames[i % lastNames.length];
  students.push({
    roll_number: rollNo,
    first_name: fn,
    last_name: ln,
    department: dept,
    date_of_birth: dob,
    gender: i % 3 === 0 ? 'Female' : 'Male',
    mobile: `98765${String(50000 + i).padStart(5,'0')}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@student.ecap.edu`,
    nationality: 'Indian',
    religion: ['Hindu','Muslim','Christian','Sikh'][i % 4],
    city: cities[i % cities.length],
    admission_year: admYear,
    current_year: currYear,
    section: section,
    parent_name: `${lastNames[(i+3) % lastNames.length]} ${lastNames[(i+1) % lastNames.length]}`,
    parent_mobile: `98761${String(10000 + i).padStart(5,'0')}`,
    address: `${i+1}, ${cities[i % cities.length]} Road, ${cities[i % cities.length]}`,
    added_by: 'admin'
  });
}

// ── Seed function ─────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    // ── Insert Faculty ──────────────────────────────
    console.log('\n📚 Inserting faculty...');
    let facInserted = 0;
    for (let i = 0; i < facultyList.length; i++) {
      const f = facultyList[i];
      const fid = 'T-' + String(i).padStart(3, '0');
      const dob = `${1970 + (i % 20)}-${String((i % 12) + 1).padStart(2,'0')}-15`;
      try {
        const r = await client.query(
          `INSERT INTO faculty
            (faculty_id, first_name, last_name, department, role, date_of_birth,
             gender, mobile, email, nationality, religion, city,
             highest_qualification, specialization, experience_years, added_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           ON CONFLICT (faculty_id) DO NOTHING`,
          [fid, f.first, f.last, f.dept, f.role, dob, f.gender,
           f.mobile, f.email, 'Indian',
           ['Hindu','Muslim','Christian','Sikh'][i % 4],
           f.city, f.qual, f.spec, f.exp, 'admin']
        );
        if (r.rowCount > 0) facInserted++;
      } catch (e) {
        console.error(`  ❌ Faculty ${fid} error: ${e.message}`);
      }
    }
    console.log(`✅ ${facInserted} faculty inserted (skipped duplicates).`);

    // ── Insert Students ─────────────────────────────
    console.log('\n🎓 Inserting students...');
    let stuInserted = 0;
    for (let idx = 0; idx < students.length; idx++) {
      const s = students[idx];
      try {
        const r = await client.query(
          `INSERT INTO students
            (roll_number, first_name, last_name, department, date_of_birth,
             gender, mobile, email, nationality, religion, city,
             admission_year, current_year, section, parent_name,
             parent_mobile, address, added_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
           ON CONFLICT (roll_number) DO NOTHING`,
          [s.roll_number, s.first_name, s.last_name, s.department,
           s.date_of_birth, s.gender, s.mobile, s.email,
           s.nationality, s.religion, s.city,
           s.admission_year, s.current_year, s.section,
           s.parent_name, s.parent_mobile, s.address, s.added_by]
        );
        if (r.rowCount > 0) stuInserted++;
      } catch (e) {
        console.error(`  ❌ Student ${s.roll_number} error: ${e.message}`);
      }
    }
    console.log(`✅ ${stuInserted} students inserted (skipped duplicates).`);

    // ── Final counts ────────────────────────────────
    const fc = await client.query('SELECT COUNT(*) FROM faculty');
    const sc = await client.query('SELECT COUNT(*) FROM students');
    console.log(`\n📊 DB totals — Faculty: ${fc.rows[0].count} | Students: ${sc.rows[0].count}`);
    console.log('\n🎉 Seeding complete!');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
