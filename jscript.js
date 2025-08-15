document.addEventListener('DOMContentLoaded', () => {
    const addCourseBtn = document.getElementById('addCourseBtn');
    const courseList = document.getElementById('courseList');
    const filterButtons = document.querySelectorAll('.filter-btn');

    let courses = JSON.parse(localStorage.getItem('courses')) || [];

    // Function to save courses to localStorage
    const saveCourses = () => {
        localStorage.setItem('courses', JSON.stringify(courses));
    };

    // Function to sort courses by date from closest to furthest
    const sortCourses = () => {
        courses.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // Function to render a single course item
    const renderCourse = (course) => {
        const courseItem = document.createElement('div');
        courseItem.classList.add('course-item', course.name.replace(/\s+/g, '-'));
        courseItem.setAttribute('data-course-name', course.name);

        const [year, month, day] = course.date.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        const dateObject = new Date(course.date + 'T00:00:00');
        const options = { weekday: 'long' };
        const dayOfWeek = new Intl.DateTimeFormat('en-US', options).format(dateObject);

        courseItem.innerHTML = `
            <h3>${course.name}</h3>
            <p><strong>Date:</strong> ${formattedDate} (<span class="day-of-week">${dayOfWeek}</span>)</p>
            <p><strong>Time:</strong> ${course.startTime} - ${course.endTime}</p>
            <p><strong>Campus:</strong> ${course.campus}</p>
            <div class="course-actions">
                <div class="counter">
                    <button class="decrement-btn" data-id="${course.id}">-</button>
                    <span class="count">${course.count}</span>
                    <button class="increment-btn" data-id="${course.id}">+</button>
                </div>
                <button class="remove-btn" data-id="${course.id}">Remove</button>
            </div>
        `;
        courseList.appendChild(courseItem);
    };

    // Function to render all courses
    const renderAllCourses = (filter = 'All') => {
        sortCourses(); // Sort the courses before rendering
        courseList.innerHTML = '';
        courses.forEach(course => {
            if (filter === 'All' || course.name === filter) {
                renderCourse(course);
            }
        });
    };

    // Add Course
    addCourseBtn.addEventListener('click', () => {
        const courseName = document.getElementById('courseName').value;
        const courseDate = document.getElementById('courseDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const campus = document.getElementById('campus').value;

        if (!courseName || !courseDate || !startTime || !endTime || !campus) {
            alert('Please fill in all course details!');
            return;
        }

        const newCourse = {
            id: Date.now(),
            name: courseName,
            date: courseDate,
            startTime: startTime,
            endTime: endTime,
            campus: campus,
            count: 0
        };

        courses.push(newCourse);
        saveCourses();
        renderAllCourses();
    });

    // Handle Clicks on Course List (for counter and remove)
    courseList.addEventListener('click', (e) => {
        if (e.target.classList.contains('increment-btn')) {
            const id = parseInt(e.target.dataset.id);
            const courseIndex = courses.findIndex(course => course.id === id);
            if (courseIndex > -1) {
                courses[courseIndex].count++;
                saveCourses();
                e.target.previousElementSibling.textContent = courses[courseIndex].count;
            }
        }

        if (e.target.classList.contains('decrement-btn')) {
            const id = parseInt(e.target.dataset.id);
            const courseIndex = courses.findIndex(course => course.id === id);
            if (courseIndex > -1 && courses[courseIndex].count > 0) {
                courses[courseIndex].count--;
                saveCourses();
                e.target.nextElementSibling.textContent = courses[courseIndex].count;
            }
        }

        if (e.target.classList.contains('remove-btn')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to remove this course?')) {
                courses = courses.filter(course => course.id !== id);
                saveCourses();
                e.target.closest('.course-item').remove();
            }
        }
    });

    // Filter Courses
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filterValue = e.target.dataset.filter;
            renderAllCourses(filterValue);
        });
    });

    // Initial render of courses when the page loads
    renderAllCourses();
});