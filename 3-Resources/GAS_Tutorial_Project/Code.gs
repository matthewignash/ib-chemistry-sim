/**
 * ═══════════════════════════════════════════════════════
 * CODE.GS — Main server-side logic
 * ═══════════════════════════════════════════════════════
 *
 * Handles:
 *   - Serving a single-page app with Tutorial + Practice tabs
 *   - Data fetching from Sheet tabs
 *   - Student response logging
 *
 * Deploy as: Web App
 *   Execute as: Me
 *   Who has access: Anyone (for Schoology iframe)
 */

// ─── SERVE PAGE ───

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');

  return template.evaluate()
    .setTitle(getConfigValue_('topicCode') + ' ' + getConfigValue_('topicName'))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include helper — allows <?!= include('Styles') ?> in templates
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── CONFIG ───

function getConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Config');
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) config[data[i][0]] = data[i][1];
  }
  return config;
}

function getConfigValue_(key) {
  var config = getConfig();
  return config[key] || '';
}

// ─── QUESTION DATA ───

/**
 * Fetches all questions for a given page type ('tutorial' or 'practice')
 * Returns array of question objects with nested steps / parts
 */
function getQuestions(pageType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Get questions
  var qSheet = ss.getSheetByName('Questions');
  var qData = qSheet.getDataRange().getValues();
  var headers = qData[0];

  var questions = [];
  for (var i = 1; i < qData.length; i++) {
    var row = qData[i];
    if (row[1] !== pageType) continue; // filter by page type

    var q = {
      id:            row[0],
      page:          row[1],
      number:        row[2],
      format:        row[3],
      topic:         row[4],
      stem:          row[5],
      options:       [row[6], row[7], row[8], row[9]].filter(function(o) { return o !== ''; }),
      correctAnswer: row[10],
      marks:         row[11],
      source:        row[12],
      keyTakeaway:   row[13],
      distractors:   {
        A: row[14] || '',
        B: row[15] || '',
        C: row[16] || '',
        D: row[17] || ''
      },
      steps: [],
      saParts: []
    };
    questions.push(q);
  }

  // 2. Attach steps (for tutorial)
  if (pageType === 'tutorial') {
    var sSheet = ss.getSheetByName('Steps');
    var sData = sSheet.getDataRange().getValues();
    for (var i = 1; i < sData.length; i++) {
      var qId = sData[i][0];
      var step = {
        num:   sData[i][1],
        title: sData[i][2],
        text:  sData[i][3]
      };
      for (var j = 0; j < questions.length; j++) {
        if (questions[j].id === qId) {
          questions[j].steps.push(step);
          break;
        }
      }
    }
  }

  // 3. Attach SA parts (for practice SA questions)
  var pSheet = ss.getSheetByName('SA_Parts');
  var pData = pSheet.getDataRange().getValues();
  for (var i = 1; i < pData.length; i++) {
    var qId = pData[i][0];
    var part = {
      label:  pData[i][1],
      prompt: pData[i][2],
      marks:  pData[i][3],
      answer: pData[i][4]
    };
    for (var j = 0; j < questions.length; j++) {
      if (questions[j].id === qId) {
        questions[j].saParts.push(part);
        break;
      }
    }
  }

  // Sort by number
  questions.sort(function(a, b) { return a.number - b.number; });

  return questions;
}

// ─── FETCH ALL DATA (single call for both tabs) ───

/**
 * Returns config + both question sets in one round trip
 * Reduces latency vs separate google.script.run calls
 */
function getAllData() {
  return {
    config: getConfig(),
    tutorial: getQuestions('tutorial'),
    practice: getQuestions('practice')
  };
}

// ─── RESPONSE LOGGING ───

/**
 * Called from client-side via google.script.run
 * @param {Object} data - { studentName, page, questionId, questionNum, answer, correctAnswer, isCorrect }
 */
function logResponse(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Responses');
  sheet.appendRow([
    new Date(),
    data.studentName || 'Anonymous',
    data.page || '',
    data.questionId || '',
    data.questionNum || '',
    data.answer || '',
    data.correctAnswer || '',
    data.isCorrect ? 'Yes' : 'No'
  ]);
  return { success: true };
}
