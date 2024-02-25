console.log('coursera.js');
// log document.referrer
console.log(document.referrer);

if (window.location.href.includes('coursera.org/learn/')) {
  trackActiveCourse();
}

function trackActiveCourse() {
  const courseHandle = window.location.href.split('coursera.org/learn/')[1].split('/')[0];
  addcourseToCoursesList(courseHandle);
  addCourseToStorage(courseHandle);
}

function addcourseToCoursesList(courseHandle) {
  chrome.storage.sync.get('courses', function (data) {
    if (data.courses) {
      console.log('Courses already tracked', data.courses);
    } else {
      // add course to chrome storage
      chrome.storage.sync.set(
        {
          courses: [courseHandle]
        },
        function (result) {
          console.log('Courses added to tracked list', result);
        }
      );
    }
  });
}

function addCourseToStorage(courseHandle) {
  chrome.storage.sync.get(courseHandle, function (data) {
    if (data[courseHandle]) {
      console.log('Course already tracked', data[courseHandle]);
    } else {
      // add course to chrome storage
      const course = {
        name: document.title.split(' - ')[0].split(' | ')[0],
        lastVisitedUrl: window.location.href,
        data: {
          'Watching videos': 0,
          'Watching Webinars': 0,
          'Reading articles': 0,
          Assignments: 0
        }
      };
      chrome.storage.sync.set(
        {
          [courseHandle]: course
        },
        function (result) {
          console.log('Course added to tracked list', result);
        }
      );
    }
  });
}
