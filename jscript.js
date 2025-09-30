document.addEventListener('DOMContentLoaded', () => {
    const addCourseBtn = document.getElementById('addCourseBtn');
    const courseList = document.getElementById('courseList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    const calendarWrapper = document.getElementById('calendarWrapper');
    const calendarView = document.getElementById('calendarView');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const calendarMonthLabel = document.getElementById('calendarMonthLabel');
    const courseModal = document.getElementById('courseModal');
    const modalDetails = document.getElementById('modalDetails');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const dayModal = document.getElementById('dayModal');
    const dayModalCloseBtn = document.getElementById('dayModalCloseBtn');
    const dayModalDateLabel = document.getElementById('dayModalDate');
    const dayModalSchedule = document.getElementById('dayModalSchedule');
    const campusSlider = document.getElementById('campusSlider');
    const campusSliderValue = document.getElementById('campusSliderValue');

    let courses = JSON.parse(localStorage.getItem('courses')) || [];
    let activeFilter = 'All';
    let viewMode = 'list';
    let currentCalendarDate = new Date();
    const campusOptions = { 0: 'Nazareth', 1: 'All', 2: 'Haifa' };
    let campusFilter = campusOptions[campusSlider.value] || 'All';
    campusSliderValue.textContent = campusFilter;

    // Function to save courses to localStorage
    const saveCourses = () => {
        localStorage.setItem('courses', JSON.stringify(courses));
    };

    // Function to sort courses by date from closest to furthest
    const sortCourses = () => {
        courses.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const isJuniorCourse = (courseName) => /^Jr-[1-4]$/i.test(courseName);

    const matchesFilters = (course) => {
        const matchesCourse = activeFilter === 'All' || course.name === activeFilter;
        const matchesCampus = campusFilter === 'All' || course.campus === campusFilter;
        return matchesCourse && matchesCampus;
    };

    const calculateEndTime = (courseName, startTime) => {
        if (!startTime) {
            return '';
        }

        const [hoursStr, minutesStr] = startTime.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return '';
        }

        const startMinutes = hours * 60 + minutes;
        const duration = isJuniorCourse(courseName) ? 90 : 120;
        const endMinutes = (startMinutes + duration) % (24 * 60);
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;

        return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    };

    const getDateInfo = (dateString) => {
        const [year, month, day] = dateString.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        const dateObject = new Date(`${dateString}T00:00:00`);
        const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObject);
        return { formattedDate, dayOfWeek, year: Number(year), month: Number(month), day: Number(day) };
    };

    const getArabicDayName = (englishDay) => {
        const lookup = {
            Sunday: 'الأحد',
            Monday: 'الاثنين',
            Tuesday: 'الثلاثاء',
            Wednesday: 'الأربعاء',
            Thursday: 'الخميس',
            Friday: 'الجمعة',
            Saturday: 'السبت'
        };
        return lookup[englishDay] || englishDay;
    };

    const copyToClipboard = async (text, triggerEl) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.top = '-1000px';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            if (triggerEl) {
                triggerEl.classList.add('copied');
                setTimeout(() => triggerEl.classList.remove('copied'), 1500);
            }
        } catch (err) {
            console.error('Failed to copy', err);
            alert('Copy failed. Please try again.');
        }
    };

    const getCourseDateTime = (course) => new Date(`${course.date}T${course.startTime || '00:00'}`);

    const parseTimeToMinutes = (timeString) => {
        if (!timeString) {
            return null;
        }

        const [hoursStr, minutesStr] = timeString.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return null;
        }

        return hours * 60 + minutes;
    };

    const formatTo12Hour = (timeString) => {
        if (!timeString) {
            return '';
        }

        const [hoursStr, minutesStr] = timeString.split(':');
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return timeString;
        }

        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) {
            hours = 12;
        }

        return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    const formatHourLabel = (hour) => {
        const normalized = ((hour % 24) + 24) % 24;
        const period = normalized >= 12 ? 'PM' : 'AM';
        const hour12 = normalized % 12 || 12;
        return `${hour12} ${period}`;
    };

    const formatMinutesDifference = (diffMinutes) => {
        if (diffMinutes === 0) {
            return 'starts at the same time';
        }

        const direction = diffMinutes > 0 ? 'after' : 'before';
        let minutes = Math.abs(diffMinutes);
        const minutesPerDay = 24 * 60;
        const days = Math.floor(minutes / minutesPerDay);
        minutes -= days * minutesPerDay;
        const hours = Math.floor(minutes / 60);
        minutes -= hours * 60;

        const parts = [];
        if (days) {
            parts.push(`${days} day${days === 1 ? '' : 's'}`);
        }
        if (hours) {
            parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
        }
        if (minutes) {
            parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
        }

        const timePhrase = parts.join(' ');
        return `starts ${timePhrase || 'shortly'} ${direction}`.replace(/\s+/g, ' ').trim();
    };

    const getSiblingCourses = (course) => {
        const targetStart = getCourseDateTime(course);
        if (Number.isNaN(targetStart.getTime())) {
            return [];
        }

        return courses
            .filter(candidate =>
                candidate.id !== course.id &&
                candidate.campus === course.campus &&
                candidate.date === course.date
            )
            .map(candidate => {
                const candidateStart = getCourseDateTime(candidate);
                if (Number.isNaN(candidateStart.getTime())) {
                    return null;
                }
                const diffMinutes = Math.round((candidateStart - targetStart) / 60000);
                return {
                    course: candidate,
                    diffMinutes,
                    absoluteDifference: Math.abs(diffMinutes),
                    startValue: candidateStart.getTime()
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                if (a.absoluteDifference === b.absoluteDifference) {
                    return a.startValue - b.startValue;
                }
                return a.absoluteDifference - b.absoluteDifference;
            })
            .slice(0, 5);
    };

    const openCourseModal = (courseId, { showSiblings = false } = {}) => {
        const course = courses.find(item => item.id === courseId);
        if (!course) {
            return;
        }

        const { formattedDate, dayOfWeek } = getDateInfo(course.date);
        const endTime = calculateEndTime(course.name, course.startTime);
        if (endTime && course.endTime !== endTime) {
            course.endTime = endTime;
            saveCourses();
        }

        const timeLabel = endTime ? `${course.startTime} - ${endTime}` : course.startTime;
        const siblingResults = getSiblingCourses(course);
        const toggleLabel = showSiblings ? 'Hide Sibling Courses' : 'Show Sibling Courses';
        const arabicDay = getArabicDayName(dayOfWeek);
        const copyPayload = `${course.name}\n${arabicDay}: ${formattedDate}\nالوقت: ${timeLabel}`;

        let siblingSection = '';
        if (showSiblings) {
            if (!siblingResults.length) {
                siblingSection = `
                    <div class="sibling-section">
                        <h4>Closest courses in ${course.campus}</h4>
                        <p class="no-siblings">No other courses found in ${course.campus} to compare.</p>
                    </div>
                `;
            } else {
                const siblingItems = siblingResults.map(({ course: sibling, diffMinutes }) => {
                    const dateInfo = getDateInfo(sibling.date);
                    const siblingEndTime = calculateEndTime(sibling.name, sibling.startTime);
                    const timeRange = siblingEndTime ? `${sibling.startTime} - ${siblingEndTime}` : sibling.startTime;
                    const diffLabel = formatMinutesDifference(diffMinutes);
                    const sameStartIndicator = diffMinutes === 0
                        ? '<span class="sibling-star" title="Starts at the same time">&#9733;</span>'
                        : '';
                    return `
                        <li>
                            <div class="sibling-title">${sibling.name} ${sameStartIndicator}</div>
                            <div class="sibling-meta">${dateInfo.formattedDate} (${dateInfo.dayOfWeek}) | ${timeRange}</div>
                            <div class="sibling-diff">${diffLabel}</div>
                        </li>
                    `;
                }).join('');

                siblingSection = `
                    <div class="sibling-section">
                        <h4>Closest courses in ${course.campus}</h4>
                        <ul class="sibling-list">${siblingItems}</ul>
                    </div>
                `;
            }
        }

        modalDetails.innerHTML = `
            <h3>${course.name}</h3>
            <button id="modalCopyBtn" class="modal-copy-btn" type="button" aria-label="Copy details for ${course.name}">
                <img src="https://cdn-icons-png.flaticon.com/512/4837/4837299.png" alt="Copy icon">
            </button>
            <p><strong>Date:</strong> ${formattedDate} (${dayOfWeek})</p>
            <p><strong>Time:</strong> ${timeLabel}</p>
            <p><strong>Campus:</strong> ${course.campus}</p>
            <p><strong>Count:</strong> ${course.count}</p>
            <button id="modalSiblingBtn" class="modal-sibling-btn">${toggleLabel}</button>
            ${siblingSection}
        `;

        const siblingToggleBtn = document.getElementById('modalSiblingBtn');
        if (siblingToggleBtn) {
            siblingToggleBtn.addEventListener('click', () => {
                openCourseModal(courseId, { showSiblings: !showSiblings });
            });
        }

        const copyBtn = document.getElementById('modalCopyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                copyToClipboard(copyPayload, copyBtn);
            });
        }

        courseModal.classList.remove('hidden');
    };

    const openEditCourseModal = (courseId) => {
        const course = courses.find(item => item.id === courseId);
        if (!course) {
            return;
        }

        const editFormId = 'editCourseForm';
        const isFull = Boolean(course.isFull);
        const fullButtonLabel = isFull ? 'Reopen Course' : 'Mark As Full';
        const fullStatusText = isFull ? 'Course is currently marked as full.' : 'Course currently accepting students.';
        const { formattedDate, dayOfWeek } = getDateInfo(course.date);
        const endTime = calculateEndTime(course.name, course.startTime);
        const timeLabel = endTime ? `${course.startTime} - ${endTime}` : course.startTime;
        const arabicDay = getArabicDayName(dayOfWeek);
        const copyPayload = `${course.name}\n${arabicDay}: ${formattedDate}\nالوقت: ${timeLabel}`;

        modalDetails.innerHTML = `
            <h3>Edit ${course.name}</h3>
            <p>You can adjust the date and start time of this course.</p>
            <button id="modalCopyBtn" class="modal-copy-btn" type="button" aria-label="Copy details for ${course.name}">
                <img src="https://cdn-icons-png.flaticon.com/512/4837/4837299.png" alt="Copy icon">
            </button>
            <form id="${editFormId}" class="edit-course-form">
                <label for="editDate">Date</label>
                <input type="date" id="editDate" name="editDate" value="${course.date}" required>
                <label for="editStartTime">Start Time</label>
                <input type="time" id="editStartTime" name="editStartTime" value="${course.startTime}" required>
                <div class="course-full-status" id="courseFullStatus">${fullStatusText}</div>
                <div class="edit-course-actions">
                    <button type="button" class="full-btn edit-full-btn" id="toggleFullBtn">${fullButtonLabel}</button>
                    <button type="submit" class="save-edit-btn">Save Changes</button>
                </div>
            </form>
        `;

        const editForm = document.getElementById(editFormId);
        if (editForm) {
            editForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const newDate = editForm.editDate.value;
                const newStartTime = editForm.editStartTime.value;

                if (!newDate || !newStartTime) {
                    alert('Please provide both date and start time.');
                    return;
                }

                course.date = newDate;
                course.startTime = newStartTime;
                course.endTime = calculateEndTime(course.name, newStartTime);

                saveCourses();

                if (viewMode === 'calendar') {
                    const { year, month } = getDateInfo(newDate);
                    currentCalendarDate = new Date(year, month - 1, 1);
                }

                renderAllCourses();
                closeCourseModal();
            });
        }

        const toggleFullBtn = document.getElementById('toggleFullBtn');
        const fullStatusEl = document.getElementById('courseFullStatus');
        const copyBtn = document.getElementById('modalCopyBtn');

        if (toggleFullBtn) {
            const updateFullControls = () => {
                if (fullStatusEl) {
                    fullStatusEl.textContent = course.isFull ? 'Course is currently marked as full.' : 'Course currently accepting students.';
                }
                toggleFullBtn.textContent = course.isFull ? 'Reopen Course' : 'Mark As Full';
                toggleFullBtn.classList.toggle('is-full', course.isFull);
            };

            updateFullControls();

            toggleFullBtn.addEventListener('click', () => {
                course.isFull = !course.isFull;
                saveCourses();
                renderAllCourses();
                updateFullControls();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const currentDate = document.getElementById('editDate')?.value || course.date;
                const currentStart = document.getElementById('editStartTime')?.value || course.startTime;
                const currentEnd = calculateEndTime(course.name, currentStart);
                const currentDateInfo = getDateInfo(currentDate);
                const currentArabicDay = getArabicDayName(currentDateInfo.dayOfWeek);
                const currentTimeLabel = currentEnd ? `${currentStart} - ${currentEnd}` : currentStart;
                const dynamicPayload = `${course.name}\n${currentArabicDay}: ${currentDateInfo.formattedDate}\nالوقت: ${currentTimeLabel}`;
                copyToClipboard(dynamicPayload, copyBtn);
            });
        }

        courseModal.classList.remove('hidden');
    };

    // Function to render a single course item
    const renderCourse = (course) => {
        const courseItem = document.createElement('div');
        const campusClass = `campus-${course.campus.toLowerCase().replace(/\s+/g, '-')}`;
        const courseStart = new Date(`${course.date}T${course.startTime || '00:00'}`);
        const now = new Date();
        const endTime = calculateEndTime(course.name, course.startTime);
        const isFull = Boolean(course.isFull);
        const fullIndicator = isFull ? '<span class="course-full-indicator">Course Full</span>' : '';

        courseItem.classList.add('course-item', course.name.replace(/\s+/g, '-'), campusClass);
        if (isFull) {
            courseItem.classList.add('course-full');
        }
        if (!Number.isNaN(courseStart.getTime()) && now >= courseStart) {
            courseItem.classList.add('course-started');
        }
        courseItem.setAttribute('data-course-name', course.name);
        courseItem.dataset.courseId = course.id;

        if (endTime && course.endTime !== endTime) {
            course.endTime = endTime;
            saveCourses();
        }

        const { formattedDate, dayOfWeek } = getDateInfo(course.date);

        courseItem.innerHTML = `
            <button class="sibling-btn" type="button" data-id="${course.id}" aria-label="View sibling courses for ${course.name}"></button>
            <h3>${course.name}</h3>
            <p><strong>Date:</strong> ${formattedDate} (<span class="day-of-week">${dayOfWeek}</span>)</p>
            <p><strong>Time:</strong> ${course.startTime}${endTime ? ` - ${endTime}` : ''}</p>
            <p><strong>Campus:</strong> ${course.campus}</p>
            <div class="course-actions">
                <div class="counter">
                    <button class="decrement-btn" data-id="${course.id}">-</button>
                    <span class="count">${course.count}</span>
                    <button class="increment-btn" data-id="${course.id}">+</button>
                </div>
                <div class="course-actions-right">
                    ${fullIndicator}
                    <button class="remove-btn" data-id="${course.id}">Remove</button>
                </div>
            </div>
        `;
        courseList.appendChild(courseItem);
    };

    const renderListView = () => {
        courseList.innerHTML = '';
        courses.forEach(course => {
            if (matchesFilters(course)) {
                renderCourse(course);
            }
        });
    };

    const renderCalendarView = () => {
        calendarView.innerHTML = '';
        const targetDate = new Date(currentCalendarDate.getTime());
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startWeekday = firstDayOfMonth.getDay();
        const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
        const now = new Date();
        const todayString = new Date().toISOString().split('T')[0];

        calendarMonthLabel.textContent = new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
        }).format(new Date(year, month, 1));

        for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
            const cell = document.createElement('div');

            if (cellIndex < startWeekday || cellIndex >= startWeekday + daysInMonth) {
                cell.classList.add('calendar-cell', 'empty');
                calendarView.appendChild(cell);
                continue;
            }

            const dayNumber = cellIndex - startWeekday + 1;
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
            const coursesForDay = courses.filter(course => matchesFilters(course) && course.date === dateString);

            cell.classList.add('calendar-cell');
            cell.dataset.date = dateString;

            const dateLabel = document.createElement('div');
            dateLabel.classList.add('calendar-date');
            dateLabel.textContent = dayNumber;

            if (dateString === todayString) {
                dateLabel.classList.add('calendar-date-today');
                const dot = document.createElement('span');
                dot.classList.add('calendar-today-dot');
                dateLabel.appendChild(dot);
            }

            cell.appendChild(dateLabel);

            coursesForDay.forEach(course => {
                const block = document.createElement('div');
                const campusClass = `campus-${course.campus.toLowerCase().replace(/\s+/g, '-')}`;
                const endTime = calculateEndTime(course.name, course.startTime);
                const courseStart = new Date(`${course.date}T${course.startTime || '00:00'}`);

                block.classList.add('calendar-course', campusClass, course.name.replace(/\s+/g, '-'));
                if (!Number.isNaN(courseStart.getTime()) && now >= courseStart) {
                    block.classList.add('started');
                }
                block.dataset.id = course.id;
                block.innerHTML = `
                    <div>${course.name}</div>
                    <div>${course.startTime}${endTime ? ` - ${endTime}` : ''}</div>
                `;
                cell.appendChild(block);
            });

            if (coursesForDay.length > 0) {
                cell.classList.add('has-calendar-courses');
            }

            calendarView.appendChild(cell);
        }
    };

    // Function to render all courses
    const renderAllCourses = () => {
        sortCourses();
        if (viewMode === 'list') {
            courseList.classList.remove('hidden');
            calendarWrapper.classList.add('hidden');
            renderListView();
        } else {
            courseList.classList.add('hidden');
            calendarWrapper.classList.remove('hidden');
            renderCalendarView();
        }
    };

    // Add Course
    addCourseBtn.addEventListener('click', () => {
        const courseName = document.getElementById('courseName').value;
        const courseDate = document.getElementById('courseDate').value;
        const startTime = document.getElementById('startTime').value;
        const campus = document.getElementById('campus').value;

        if (!courseName || !courseDate || !startTime || !campus) {
            alert('Please fill in all course details!');
            return;
        }

        const autoEndTime = calculateEndTime(courseName, startTime);

        const newCourse = {
            id: Date.now(),
            name: courseName,
            date: courseDate,
            startTime: startTime,
            endTime: autoEndTime,
            campus: campus,
            count: 0,
            isFull: false
        };

        courses.push(newCourse);
        saveCourses();
        renderAllCourses();
    });

    // Handle Clicks on Course List (actions, toggles, editing)
    courseList.addEventListener('click', (e) => {
        if (e.target.classList.contains('increment-btn')) {
            const id = parseInt(e.target.dataset.id);
            const courseIndex = courses.findIndex(course => course.id === id);
            if (courseIndex > -1 && !courses[courseIndex].isFull) {
                courses[courseIndex].count++;
                saveCourses();
                e.target.previousElementSibling.textContent = courses[courseIndex].count;
            }
            return;
        }

        if (e.target.classList.contains('decrement-btn')) {
            const id = parseInt(e.target.dataset.id);
            const courseIndex = courses.findIndex(course => course.id === id);
            if (courseIndex > -1 && courses[courseIndex].count > 0 && !courses[courseIndex].isFull) {
                courses[courseIndex].count--;
                saveCourses();
                e.target.nextElementSibling.textContent = courses[courseIndex].count;
            }
            return;
        }

        if (e.target.classList.contains('sibling-btn')) {
            const id = Number(e.target.dataset.id);
            if (!Number.isNaN(id)) {
                openCourseModal(id, { showSiblings: true });
            }
            return;
        }

        if (e.target.classList.contains('remove-btn')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to remove this course?')) {
                courses = courses.filter(course => course.id !== id);
                saveCourses();
                e.target.closest('.course-item').remove();
            }
            return;
        }

        const courseItemEl = e.target.closest('.course-item');
        if (!courseItemEl) {
            return;
        }

        if (e.target.closest('.course-actions')) {
            return;
        }

        const courseId = Number(courseItemEl.dataset.courseId);
        if (!Number.isNaN(courseId)) {
            openEditCourseModal(courseId);
        }
    });

    // Filter Courses
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            activeFilter = e.target.dataset.filter;

            if (viewMode === 'calendar') {
                const filteredCourses = courses.filter(matchesFilters);
                if (filteredCourses.length > 0) {
                    const { year, month } = getDateInfo(filteredCourses[0].date);
                    currentCalendarDate = new Date(year, month - 1, 1);
                }
            }

            renderAllCourses();
        });
    });

    const updateCampusFilter = () => {
        campusFilter = campusOptions[campusSlider.value] || 'All';
        campusSliderValue.textContent = campusFilter;

        if (viewMode === 'calendar') {
            const filteredCourses = courses.filter(matchesFilters);
            if (filteredCourses.length > 0) {
                const { year, month } = getDateInfo(filteredCourses[0].date);
                currentCalendarDate = new Date(year, month - 1, 1);
            }
        }

        renderAllCourses();
    };

    campusSlider.addEventListener('input', updateCampusFilter);
    campusSlider.addEventListener('change', updateCampusFilter);

    // Toggle between list and calendar views
    toggleViewBtn.addEventListener('click', () => {
        viewMode = viewMode === 'list' ? 'calendar' : 'list';
        toggleViewBtn.textContent = viewMode === 'list' ? 'Calendar View' : 'List View';

        if (viewMode === 'calendar') {
            const filteredCourses = courses.filter(matchesFilters);
            if (filteredCourses.length > 0) {
                const { year, month } = getDateInfo(filteredCourses[0].date);
                currentCalendarDate = new Date(year, month - 1, 1);
            } else {
                currentCalendarDate = new Date();
            }
        }

        renderAllCourses();
    });

    prevMonthBtn.addEventListener('click', () => {
        if (viewMode !== 'calendar') {
            return;
        }
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderAllCourses();
    });

    nextMonthBtn.addEventListener('click', () => {
        if (viewMode !== 'calendar') {
            return;
        }
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderAllCourses();
    });

    const closeCourseModal = () => {
        courseModal.classList.add('hidden');
        modalDetails.innerHTML = '';
    };

    const closeDayModal = () => {
        if (!dayModal) {
            return;
        }
        dayModal.classList.add('hidden');
        if (dayModalDateLabel) {
            dayModalDateLabel.textContent = '';
        }
        if (dayModalSchedule) {
            dayModalSchedule.innerHTML = '';
        }
    };

    const openDayModal = (dateString) => {
        if (!dayModal || !dayModalSchedule || !dayModalDateLabel) {
            return;
        }

        const dayCourses = courses
            .filter(course => matchesFilters(course) && course.date === dateString)
            .sort((a, b) => {
                const timeA = parseTimeToMinutes(a.startTime) ?? Number.POSITIVE_INFINITY;
                const timeB = parseTimeToMinutes(b.startTime) ?? Number.POSITIVE_INFINITY;
                return timeA - timeB;
            });

        if (!dayCourses.length) {
            return;
        }

        const { formattedDate, dayOfWeek } = getDateInfo(dateString);
        dayModalDateLabel.textContent = `${dayOfWeek}, ${formattedDate}`;

        const validStartTimes = dayCourses
            .map(course => parseTimeToMinutes(course.startTime))
            .filter(minutes => minutes !== null);

        const hoursToShow = 12;
        const defaultStartHour = 8;
        const rowHeight = 60;

        let startHour = validStartTimes.length
            ? Math.max(0, Math.floor(Math.min(...validStartTimes) / 60) - 1)
            : defaultStartHour;

        if (startHour + hoursToShow > 24) {
            startHour = 24 - hoursToShow;
        }

        const totalMinutes = hoursToShow * 60;
        const pixelsPerMinute = rowHeight / 60;

        dayModalSchedule.innerHTML = '';

        const summary = document.createElement('div');
        summary.classList.add('day-schedule-summary');
        summary.textContent = `${dayCourses.length} course${dayCourses.length === 1 ? '' : 's'} scheduled`;
        dayModalSchedule.appendChild(summary);

        const scheduleWrapper = document.createElement('div');
        scheduleWrapper.classList.add('day-schedule-inner');
        scheduleWrapper.style.setProperty('--row-height', `${rowHeight}px`);
        scheduleWrapper.style.setProperty('--hours-count', `${hoursToShow}`);

        const rowsList = document.createElement('ol');
        rowsList.classList.add('day-schedule-rows');
        rowsList.style.setProperty('--row-height', `${rowHeight}px`);
        rowsList.style.setProperty('--hours-count', `${hoursToShow}`);

        for (let i = 0; i < hoursToShow; i++) {
            const hour = startHour + i;
            const row = document.createElement('li');
            row.classList.add('day-schedule-row');

            const timeLabel = document.createElement('span');
            timeLabel.classList.add('day-schedule-time');
            timeLabel.textContent = formatHourLabel(hour);

            const slot = document.createElement('span');
            slot.classList.add('day-schedule-slot');

            row.appendChild(timeLabel);
            row.appendChild(slot);
            rowsList.appendChild(row);
        }

        const eventsLayer = document.createElement('div');
        eventsLayer.classList.add('day-schedule-events');
        eventsLayer.style.setProperty('--visible-minutes', `${totalMinutes}`);
        eventsLayer.style.setProperty('--row-height', `${rowHeight}px`);
        eventsLayer.style.setProperty('--hours-count', `${hoursToShow}`);

        dayCourses.forEach(course => {
            const eventBlock = document.createElement('button');
            eventBlock.type = 'button';
            eventBlock.classList.add('day-schedule-event');

            const startMinutesAbsolute = parseTimeToMinutes(course.startTime);
            const calculatedEndTime = calculateEndTime(course.name, course.startTime) || course.endTime;
            let endMinutesAbsolute = parseTimeToMinutes(calculatedEndTime);

            let adjustedStart = 0;
            let durationMinutes = 60;

            if (startMinutesAbsolute !== null) {
                adjustedStart = startMinutesAbsolute - startHour * 60;
                if (endMinutesAbsolute !== null) {
                    let computedDuration = endMinutesAbsolute - startMinutesAbsolute;
                    if (computedDuration <= 0) {
                        computedDuration += 24 * 60;
                    }
                    durationMinutes = computedDuration;
                }
            }

            const segmentStart = Math.max(0, adjustedStart);
            const segmentEnd = Math.min(totalMinutes, adjustedStart + durationMinutes);

            if (segmentEnd <= 0 || segmentStart >= totalMinutes) {
                return;
            }

            const topPixels = segmentStart * pixelsPerMinute;
            const heightPixels = Math.max(24, (segmentEnd - segmentStart) * pixelsPerMinute);

            eventBlock.style.top = `${topPixels}px`;
            eventBlock.style.height = `${heightPixels}px`;

            eventBlock.dataset.id = course.id;
            eventBlock.innerHTML = `
                <span class="day-event-title">${course.name}</span>
                <span class="day-event-time">${formatTo12Hour(course.startTime)}${calculatedEndTime ? ` - ${formatTo12Hour(calculatedEndTime)}` : ''}</span>
                <span class="day-event-campus">${course.campus}</span>
            `;

            if (course.isFull) {
                eventBlock.classList.add('day-schedule-event-full');
            }

            eventsLayer.appendChild(eventBlock);
        });

        scheduleWrapper.appendChild(rowsList);
        scheduleWrapper.appendChild(eventsLayer);
        dayModalSchedule.appendChild(scheduleWrapper);

        dayModal.classList.remove('hidden');
    };

    modalCloseBtn.addEventListener('click', closeCourseModal);

    if (dayModalCloseBtn) {
        dayModalCloseBtn.addEventListener('click', closeDayModal);
    }

    courseModal.addEventListener('click', (e) => {
        if (e.target === courseModal) {
            closeCourseModal();
        }
    });

    if (dayModal) {
        dayModal.addEventListener('click', (e) => {
            if (e.target === dayModal) {
                closeDayModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCourseModal();
            closeDayModal();
        }
    });

    calendarView.addEventListener('click', (e) => {
        const courseBlock = e.target.closest('.calendar-course');
        if (!courseBlock) {
            const cell = e.target.closest('.calendar-cell');
            if (!cell || cell.classList.contains('empty') || !cell.classList.contains('has-calendar-courses')) {
                return;
            }

            const { date } = cell.dataset;
            if (date) {
                openDayModal(date);
            }
            return;
        }

        const courseId = Number(courseBlock.dataset.id);
        if (!Number.isNaN(courseId)) {
            openCourseModal(courseId);
        }
    });

    if (dayModalSchedule) {
        dayModalSchedule.addEventListener('click', (event) => {
            const eventBlock = event.target.closest('.day-schedule-event');
            if (!eventBlock) {
                return;
            }

            const courseId = Number(eventBlock.dataset.id);
            if (!Number.isNaN(courseId)) {
                closeDayModal();
                openCourseModal(courseId);
            }
        });
    }

    // Initial render of courses when the page loads
    renderAllCourses();
});
