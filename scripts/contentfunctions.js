function getAPIHandle() {
  // GetAPI(window);
  return true;
}

var startTimeStamp = null;
function loadPage() {
  //record the time that the learner started the SCO so that we can report the total time
  startTimeStamp = new Date();

  //initialize communication with the LMS
  ScormProcessInitialize();

  //it's a best practice to set the completion status to incomplete when
  //first launching the course (if the course is not already completed)
  var completionStatus = ScormProcessGetValue('cmi.completion_status', true);
  console.log({ completionStatus });
  if (completionStatus === 'unknown') {
    console.log('will set incomplete');
    ScormProcessSetValue('cmi.completion_status', 'incomplete');
  }

  return true;
}

var processedUnload = false;
function unloadPage() {
  //don't call this function twice
  if (processedUnload === true) return;
  processedUnload = true;

  //record the session time
  var endTimeStamp = new Date();
  var totalMilliseconds = endTimeStamp.getTime() - startTimeStamp.getTime();
  var scormTime = ConvertMilliSecondsIntoSCORM2004Time(totalMilliseconds);
  ScormProcessSetValue('cmi.session_time', scormTime);

  //if the user just closes the browser, we will default to saving their progress data.
  ScormProcessSetValue('cmi.exit', 'suspend');
  ScormProcessTerminate();
  return;
}

function doLMSGetValue(element) {
  element = sanitizeElement(element);
  // var checkErrors = element === 'cmi.location' ? false : true;
  var value = ScormProcessGetValue(element, false);
  console.log('doLMSGetValue', { value });
  return value;
}

function doLMSSetValue(element, value) {
  element = sanitizeElement(element);
  if (
    element === 'cmi.completion_status' &&
    (value === 'passed' || value === 'failed')
  ) {
    element = 'cmi.success_status';
  }
  ScormProcessSetValue(sanitizeElement(element), value);
  return true;
}

function doLMSCommit() {
  ScormProcessCommit(); // different than 3rd edition, 4th edition has commit
  return true;
}

function sanitizeElement(element = '') {
  element = element.replace('cmi.core.lesson_location', 'cmi.location');
  element = element.replace('cmi.core.lesson_status', 'cmi.completion_status');
  element = element.replace('cmi.core.student_id', 'cmi.learner_id');
  element = element.replace('cmi.core.student_name', 'cmi.learner_name');
  element = element.replace('cmi.core', 'cmi');
  return element;
}

function ConvertMilliSecondsIntoSCORM2004Time(intTotalMilliseconds) {
  var ScormTime = '';

  var HundredthsOfASecond; //decrementing counter - work at the hundreths of a second level because that is all the precision that is required

  var Seconds; // 100 hundreths of a seconds
  var Minutes; // 60 seconds
  var Hours; // 60 minutes
  var Days; // 24 hours
  var Months; // assumed to be an "average" month (figures a leap year every 4 years) = ((365*4) + 1) / 48 days - 30.4375 days per month
  var Years; // assumed to be 12 "average" months

  var HUNDREDTHS_PER_SECOND = 100;
  var HUNDREDTHS_PER_MINUTE = HUNDREDTHS_PER_SECOND * 60;
  var HUNDREDTHS_PER_HOUR = HUNDREDTHS_PER_MINUTE * 60;
  var HUNDREDTHS_PER_DAY = HUNDREDTHS_PER_HOUR * 24;
  var HUNDREDTHS_PER_MONTH = HUNDREDTHS_PER_DAY * ((365 * 4 + 1) / 48);
  var HUNDREDTHS_PER_YEAR = HUNDREDTHS_PER_MONTH * 12;

  HundredthsOfASecond = Math.floor(intTotalMilliseconds / 10);

  Years = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_YEAR);
  HundredthsOfASecond -= Years * HUNDREDTHS_PER_YEAR;

  Months = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_MONTH);
  HundredthsOfASecond -= Months * HUNDREDTHS_PER_MONTH;

  Days = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_DAY);
  HundredthsOfASecond -= Days * HUNDREDTHS_PER_DAY;

  Hours = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_HOUR);
  HundredthsOfASecond -= Hours * HUNDREDTHS_PER_HOUR;

  Minutes = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_MINUTE);
  HundredthsOfASecond -= Minutes * HUNDREDTHS_PER_MINUTE;

  Seconds = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_SECOND);
  HundredthsOfASecond -= Seconds * HUNDREDTHS_PER_SECOND;

  if (Years > 0) {
    ScormTime += Years + 'Y';
  }
  if (Months > 0) {
    ScormTime += Months + 'M';
  }
  if (Days > 0) {
    ScormTime += Days + 'D';
  }

  //check to see if we have any time before adding the "T"
  if (HundredthsOfASecond + Seconds + Minutes + Hours > 0) {
    ScormTime += 'T';

    if (Hours > 0) {
      ScormTime += Hours + 'H';
    }

    if (Minutes > 0) {
      ScormTime += Minutes + 'M';
    }

    if (HundredthsOfASecond + Seconds > 0) {
      ScormTime += Seconds;

      if (HundredthsOfASecond > 0) {
        ScormTime += '.' + HundredthsOfASecond;
      }

      ScormTime += 'S';
    }
  }

  if (ScormTime == '') {
    ScormTime = '0S';
  }

  ScormTime = 'P' + ScormTime;

  return ScormTime;
}
