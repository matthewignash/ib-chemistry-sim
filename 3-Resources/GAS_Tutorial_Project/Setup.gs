/**
 * ═══════════════════════════════════════════════════════
 * SETUP — Run this ONCE to create the Sheet structure
 * ═══════════════════════════════════════════════════════
 *
 * After creating a new Google Sheet and opening the
 * Apps Script editor (Extensions → Apps Script):
 *   1. Paste all .gs files into the editor
 *   2. Paste all .html files as HTML files
 *   3. Run setupSheet() from this file
 *   4. Run populateR329Sample() to load the R3.2.9-11 data
 *
 * The Sheet will have 5 tabs:
 *   Config     — page titles, descriptions, settings
 *   Questions  — one row per MC or SA question
 *   Steps      — walkthrough steps for tutorial questions
 *   SA_Parts   — multi-part prompts for SA questions
 *   Responses  — auto-logged student answer data
 */

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // ─── CONFIG TAB ───
  var config = getOrCreateSheet_(ss, 'Config');
  config.clear();
  config.getRange('A1:B1').setValues([['Key', 'Value']]).setFontWeight('bold');
  config.getRange('A2:B8').setValues([
    ['tutorialTitle', 'Worked Tutorial'],
    ['tutorialSubtitle', 'Step-by-Step Solutions'],
    ['practiceTitle', 'Practice Problems'],
    ['practiceSubtitle', 'Original Problems with Answer Key'],
    ['topicTag', 'IB Chemistry'],
    ['topicCode', 'R3.2.9–3.2.11'],
    ['topicName', 'Organic Redox Reactions']
  ]);
  config.setColumnWidth(1, 180);
  config.setColumnWidth(2, 400);
  formatHeaderRow_(config);

  // ─── QUESTIONS TAB ───
  var questions = getOrCreateSheet_(ss, 'Questions');
  questions.clear();
  var qHeaders = [
    'ID', 'Page', 'Number', 'Format', 'Topic', 'Stem',
    'OptionA', 'OptionB', 'OptionC', 'OptionD',
    'CorrectAnswer', 'Marks', 'Source',
    'KeyTakeaway',
    'DistractorA', 'DistractorB', 'DistractorC', 'DistractorD'
  ];
  questions.getRange(1, 1, 1, qHeaders.length).setValues([qHeaders]).setFontWeight('bold');
  questions.setFrozenRows(1);
  // Column widths
  questions.setColumnWidth(1, 60);   // ID
  questions.setColumnWidth(2, 80);   // Page
  questions.setColumnWidth(3, 60);   // Number
  questions.setColumnWidth(4, 60);   // Format
  questions.setColumnWidth(5, 200);  // Topic
  questions.setColumnWidth(6, 400);  // Stem
  for (var i = 7; i <= 10; i++) questions.setColumnWidth(i, 200); // Options
  questions.setColumnWidth(11, 60);  // Correct
  questions.setColumnWidth(12, 50);  // Marks
  questions.setColumnWidth(13, 100); // Source
  questions.setColumnWidth(14, 350); // KeyTakeaway
  for (var i = 15; i <= 18; i++) questions.setColumnWidth(i, 300); // Distractors
  formatHeaderRow_(questions);

  // ─── STEPS TAB (tutorial walkthrough) ───
  var steps = getOrCreateSheet_(ss, 'Steps');
  steps.clear();
  var sHeaders = ['QuestionID', 'StepNum', 'StepTitle', 'StepText'];
  steps.getRange(1, 1, 1, sHeaders.length).setValues([sHeaders]).setFontWeight('bold');
  steps.setFrozenRows(1);
  steps.setColumnWidth(1, 100);
  steps.setColumnWidth(2, 80);
  steps.setColumnWidth(3, 250);
  steps.setColumnWidth(4, 600);
  formatHeaderRow_(steps);

  // ─── SA_PARTS TAB ───
  var parts = getOrCreateSheet_(ss, 'SA_Parts');
  parts.clear();
  var pHeaders = ['QuestionID', 'PartLabel', 'PartPrompt', 'PartMarks', 'PartAnswer'];
  parts.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]).setFontWeight('bold');
  parts.setFrozenRows(1);
  parts.setColumnWidth(1, 100);
  parts.setColumnWidth(2, 80);
  parts.setColumnWidth(3, 400);
  parts.setColumnWidth(4, 80);
  parts.setColumnWidth(5, 500);
  formatHeaderRow_(parts);

  // ─── RESPONSES TAB ───
  var responses = getOrCreateSheet_(ss, 'Responses');
  responses.clear();
  var rHeaders = ['Timestamp', 'StudentName', 'Page', 'QuestionID', 'QuestionNum', 'StudentAnswer', 'CorrectAnswer', 'IsCorrect'];
  responses.getRange(1, 1, 1, rHeaders.length).setValues([rHeaders]).setFontWeight('bold');
  responses.setFrozenRows(1);
  responses.setColumnWidth(1, 160);
  responses.setColumnWidth(2, 150);
  formatHeaderRow_(responses);

  // Activate Questions tab
  ss.setActiveSheet(questions);

  SpreadsheetApp.getUi().alert(
    'Setup Complete',
    'Sheet structure created with 5 tabs: Config, Questions, Steps, SA_Parts, Responses.\n\n' +
    'Next step: Run populateR329Sample() to load the R3.2.9-11 sample data.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ═══════════════════════════════════════════════════════
// SAMPLE DATA — R3.2.9-11 Organic Redox Reactions
// ═══════════════════════════════════════════════════════

function populateR329Sample() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // ─── QUESTIONS ───
  var qSheet = ss.getSheetByName('Questions');
  var questions = [
    // TUTORIAL QUESTIONS (T1-T5)
    ['T1', 'tutorial', 1, 'MC', 'Secondary Alcohol Oxidation',
     'Which type of compound can be made in one step from a secondary alcohol?',
     'an aldehyde', 'an alkane', 'a carboxylic acid', 'a ketone',
     'D', 1, 'Kognity',
     'Primary alcohols can be oxidized to aldehydes or carboxylic acids (depending on apparatus). Secondary alcohols can only be oxidized to ketones. Tertiary alcohols cannot be oxidized at all.',
     'Aldehydes come from oxidation of primary alcohols — the –OH is on a carbon with only one other C. A secondary alcohol cannot form an aldehyde.',
     'Converting an alcohol to an alkane would require reduction (removing the –OH) and is not a standard IB reaction pathway.',
     'Carboxylic acids come from further oxidation of an aldehyde (from a primary alcohol under reflux). A secondary alcohol → ketone is the end of the line.',
     ''],

    ['T2', 'tutorial', 2, 'MC', 'Apparatus & Product Control',
     'Ethanol is heated with acidified potassium dichromate(VI). Which product is obtained if the apparatus uses distillation rather than reflux?',
     'ethanoic acid', 'ethanal', 'ethane', 'ethanol is not oxidized under these conditions',
     'B', 1, 'Supplementary',
     'The apparatus determines the product. Distillation = aldehyde (removed before further oxidation). Reflux = carboxylic acid (complete oxidation). Same reagents — different outcomes.',
     'Ethanoic acid would be the product under reflux, not distillation. Reflux keeps the intermediate aldehyde in the mixture for further oxidation.',
     '',
     'Ethane (C₂H₆) is an alkane. There is no standard pathway from ethanol to ethane via oxidation.',
     'Primary alcohols are readily oxidized by acidified K₂Cr₂O₇. Only tertiary alcohols resist oxidation.'],

    ['T3', 'tutorial', 3, 'MC', 'Dichromate Color Change',
     'Samples of three different alcohols are each warmed with acidified potassium dichromate(VI) solution. Which alcohol will not cause a color change from orange to green?',
     'butan-1-ol', 'butan-2-ol', '2-methylpropan-2-ol', 'propan-1-ol',
     'C', 1, 'Supplementary',
     'The dichromate color change (orange → green) distinguishes tertiary alcohols from primary/secondary. Tertiary = no change. This same test distinguishes aldehydes from ketones.',
     'Butan-1-ol is a primary alcohol — oxidized to butanal/butanoic acid. Dichromate turns green.',
     'Butan-2-ol is a secondary alcohol — oxidized to butanone. Dichromate turns green.',
     '',
     'Propan-1-ol is a primary alcohol — oxidized to propanal/propanoic acid. Dichromate turns green.'],

    ['T4', 'tutorial', 4, 'MC', 'Hydrogenation of Alkenes',
     'Propene reacts with hydrogen gas in the presence of a nickel catalyst at 150°C. What is the organic product and what type of reaction has occurred?',
     'propane; reduction', 'propane; oxidation', 'propan-1-ol; reduction', 'propanal; oxidation',
     'A', 1, 'Supplementary',
     'Hydrogenation conditions: H₂ gas + Ni (or Pt/Pd) catalyst + heat (~150°C). The product is always an alkane (saturated). This is a reduction because hydrogen is gained.',
     '',
     'The product is correct but the classification is wrong. Adding H₂ is reduction, not oxidation.',
     'Propan-1-ol requires addition of water (hydration), not H₂. Different reagent, different product.',
     'Propanal is an aldehyde from oxidizing propan-1-ol — a completely different reaction pathway.'],

    ['T5', 'tutorial', 5, 'MC', 'Oxidation State Changes',
     'In the oxidation of ethanol to ethanoic acid using acidified K₂Cr₂O₇ under reflux, what happens to the oxidation state of the carbon bonded to the oxygen?',
     'It decreases from −1 to −3', 'It stays the same', 'It increases from −1 to +3', 'It increases from 0 to +2',
     'C', 1, 'Supplementary',
     'As carbon forms more bonds to O (or loses bonds to H), its oxidation state increases → oxidation. The reverse is reduction.',
     'A decrease in oxidation state would mean reduction, not oxidation. This contradicts what is happening.',
     'If there were no change, no redox reaction would have occurred. We know oxidation happens because the dichromate changes color.',
     '',
     'The starting oxidation state of −1 (not 0) and the final state of +3 (not +2) are both incorrect here.'],

    // PRACTICE QUESTIONS (P1-P5)
    ['P1', 'practice', 1, 'MC', 'Secondary Alcohol Product & Color',
     'Pentan-3-ol is heated under reflux with an excess of acidified potassium dichromate(VI). Which row correctly identifies the organic product and the color change observed?',
     'Pentanal; orange to green', 'Pentan-3-one; orange to green', 'Pentanoic acid; orange to green', 'Pentan-3-one; orange to purple',
     'B', 1, 'Original',
     '', // no key takeaway for practice
     'Pentanal is an aldehyde — would come from a primary alcohol (pentan-1-ol), not secondary.',
     '',
     'Pentanoic acid is a carboxylic acid from full oxidation of a primary alcohol — secondary alcohols stop at the ketone.',
     'The product is correct but the color change is wrong — dichromate goes orange→green, not purple (that is permanganate KMnO₄).'],

    ['P2', 'practice', 2, 'SA', 'Primary Alcohol Oxidation Pathway',
     'Propan-1-ol can be oxidized to two different products depending on the experimental conditions.',
     '', '', '', '',
     '', 4, 'Original',
     '', '', '', '', ''],

    ['P3', 'practice', 3, 'MC', 'Hydrogenation Conditions',
     'But-1-ene undergoes hydrogenation. Which statement about this reaction is correct?',
     'The product is but-1-yne and the reaction is an oxidation',
     'The product is butane and the reaction requires UV light as a catalyst',
     'The product is butane and the reaction requires a nickel catalyst and heat',
     'The product is butan-1-ol and the reaction requires a nickel catalyst',
     'C', 1, 'Original',
     '',
     'But-1-yne has a triple bond (fewer H atoms) — hydrogenation adds H₂, not removes it.',
     'The product is correct but UV light is the condition for free-radical substitution, not hydrogenation.',
     '',
     'Butan-1-ol requires hydration (H₂O, not H₂), typically using H₃PO₄ catalyst.'],

    ['P4', 'practice', 4, 'SA', 'Distinguishing Alcohols Experimentally',
     'Three unlabeled bottles each contain one of the following: ethanol (a primary alcohol), propan-2-ol (a secondary alcohol), and 2-methylpropan-2-ol (a tertiary alcohol). A student adds acidified K₂Cr₂O₇ to each and heats.',
     '', '', '', '',
     '', 3, 'Original',
     '', '', '', '', ''],

    ['P5', 'practice', 5, 'SA', 'Cyclohexene Hydrogenation',
     'Cyclohexene (C₆H₁₀) is an unsaturated cyclic hydrocarbon containing one C=C double bond.',
     '', '', '', '',
     '', 3, 'Original',
     '', '', '', '', '']
  ];
  qSheet.getRange(2, 1, questions.length, questions[0].length).setValues(questions);

  // ─── STEPS (Tutorial walkthrough) ───
  var sSheet = ss.getSheetByName('Steps');
  var steps = [
    // T1 steps
    ['T1', 1, 'Classify the alcohol', 'A <strong>secondary alcohol</strong> has the –OH group bonded to a carbon that is itself attached to <strong>two</strong> other carbon atoms. Example: propan-2-ol (CH₃CH(OH)CH₃).'],
    ['T1', 2, 'Recall the oxidation products', 'When a secondary alcohol is oxidized (e.g., using acidified K₂Cr₂O₇), the C–OH bond on the secondary carbon is converted to a C=O bond. Because there are carbon atoms on <strong>both sides</strong> of the carbonyl, the product is a <strong>ketone</strong>.'],
    ['T1', 3, 'Confirm "one step"', 'This is a direct, one-step oxidation. No further oxidation of the ketone occurs under normal conditions because there is no H atom on the carbonyl carbon to be removed.'],

    // T2 steps
    ['T2', 1, 'Identify the alcohol type', 'Ethanol (CH₃CH₂OH) is a <strong>primary alcohol</strong> — the –OH is on a terminal carbon bonded to only one other carbon.'],
    ['T2', 2, 'Primary alcohol oxidation pathway', 'Primary alcohols undergo a two-stage oxidation: alcohol → aldehyde → carboxylic acid. The first oxidation changes –CH₂OH to –CHO. The second changes –CHO to –COOH.'],
    ['T2', 3, 'Role of distillation', '<strong>Distillation</strong> removes the aldehyde product from the reaction mixture as it forms. Since aldehydes have lower boiling points, they vaporize and are collected <em>before further oxidation</em>.'],
    ['T2', 4, 'Contrast with reflux', 'Under <strong>reflux</strong>, vapors condense and return to the flask, keeping the aldehyde in contact with the oxidizing agent for full oxidation to the carboxylic acid.'],

    // T3 steps
    ['T3', 1, 'What the color change means', 'Acidified K₂Cr₂O₇ is <strong>orange</strong>. When it oxidizes an alcohol, Cr(VI) is reduced to Cr(III), which is <strong>green</strong>. No oxidation = no color change.'],
    ['T3', 2, 'Classify each alcohol', '<strong>A — butan-1-ol:</strong> –OH on C1 → primary ✓ oxidizable<br><strong>B — butan-2-ol:</strong> –OH on C2, carbons on both sides → secondary ✓ oxidizable<br><strong>C — 2-methylpropan-2-ol:</strong> –OH on C bonded to three other carbons → tertiary ✗ not oxidizable<br><strong>D — propan-1-ol:</strong> –OH on C1 → primary ✓ oxidizable'],
    ['T3', 3, 'Apply the rule', 'Tertiary alcohols <strong>cannot be oxidized</strong> because the carbon bearing the –OH has no hydrogen atom to lose. No C–H bond on that carbon means no oxidation → solution stays <strong>orange</strong>.'],

    // T4 steps
    ['T4', 1, 'Identify the reaction', '<strong>Hydrogenation</strong> is the addition of H₂ across a C=C double bond. The conditions (Ni catalyst, ~150°C) are standard for catalytic hydrogenation.'],
    ['T4', 2, 'Determine the product', 'CH₃CH=CH₂ + H₂ → CH₃CH₂CH₃. The C=C becomes a C–C single bond. Each carbon of the former double bond gains one H. Product: <strong>propane</strong>.'],
    ['T4', 3, 'Classify as oxidation or reduction', 'Adding hydrogen <strong>decreases</strong> the oxidation state of carbon → this is a <strong>reduction</strong>. Mnemonic: "OIL RIG" — Reduction Is Gain of hydrogen.'],

    // T5 steps
    ['T5', 1, 'Assign oxidation state in ethanol', 'Carbon-2 in CH₃CH₂OH is bonded to: 1 C, 2 H, 1 O. Each C–H gives −1 (×2 = −2). C–O gives +1. C–C gives 0. Total: <strong>−1</strong>.'],
    ['T5', 2, 'Assign oxidation state in ethanoic acid', 'The –COOH carbon is bonded to: 1 C, 2 O atoms (one =O, one –OH), no H. C=O gives +2. C–OH gives +1. C–C gives 0. Total: <strong>+3</strong>.'],
    ['T5', 3, 'Calculate the change', 'Oxidation state: −1 → +3, an increase of 4. An <em>increase</em> in oxidation state confirms this is an <strong>oxidation</strong>.']
  ];
  sSheet.getRange(2, 1, steps.length, steps[0].length).setValues(steps);

  // ─── SA PARTS ───
  var pSheet = ss.getSheetByName('SA_Parts');
  var saParts = [
    // P2 parts
    ['P2', 'a', 'State the oxidizing agent and the acid used.', 1, 'Potassium dichromate(VI) / K₂Cr₂O₇ acidified with dilute sulfuric acid / H₂SO₄.'],
    ['P2', 'b', 'Identify the two possible organic products, and for each, state whether distillation or reflux is used.', 2, 'Propanal (an aldehyde) — obtained by distillation. Propanoic acid (a carboxylic acid) — obtained by reflux. [1 mark for each correct product-apparatus pair]'],
    ['P2', 'c', 'Explain why distillation gives a different product from reflux.', 1, 'Distillation removes the aldehyde from the reaction mixture as it forms (lower boiling point), preventing further oxidation. Reflux returns vapors to the flask, keeping the aldehyde in contact with the oxidizing agent for complete oxidation to the carboxylic acid.'],

    // P4 parts
    ['P4', 'a', 'Describe the observations for each bottle.', 2, 'Ethanol (primary): orange to green — oxidized to ethanal/ethanoic acid. Propan-2-ol (secondary): orange to green — oxidized to propanone. 2-methylpropan-2-ol (tertiary): no color change — remains orange, cannot be oxidized.'],
    ['P4', 'b', 'The student observes that two bottles change color. Suggest one additional test that could distinguish between the products of those two bottles.', 1, 'Add Tollens\' reagent: the aldehyde (from primary alcohol) gives a silver mirror; the ketone (from secondary alcohol) does not. OR Add Fehling\'s solution: aldehyde gives red/orange precipitate; ketone shows no change.'],

    // P5 parts
    ['P5', 'a', 'Write the equation for the hydrogenation of cyclohexene. Include the catalyst and approximate temperature.', 1, 'C₆H₁₀ + H₂ → C₆H₁₂ (Ni catalyst, ~150°C). Accept Pt or Pd as catalyst.'],
    ['P5', 'b', 'Explain why this reaction is classified as a reduction, referring to oxidation states.', 1, 'The carbon atoms involved in the double bond gain hydrogen atoms. Gaining hydrogen (decreasing oxidation state) is the definition of reduction.'],
    ['P5', 'c', 'State one physical property that would differ between cyclohexene and the product of the reaction.', 1, 'Cyclohexene decolorizes bromine water; cyclohexane does not. OR Cyclohexene reacts with KMnO₄; cyclohexane does not.']
  ];
  pSheet.getRange(2, 1, saParts.length, saParts[0].length).setValues(saParts);

  SpreadsheetApp.getUi().alert(
    'Sample Data Loaded',
    'R3.2.9-11 data has been loaded:\n' +
    '• 10 questions (5 tutorial + 5 practice)\n' +
    '• 16 walkthrough steps\n' +
    '• 8 SA question parts\n\n' +
    'You can now deploy the web app.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ═══════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatHeaderRow_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var range = sheet.getRange(1, 1, 1, lastCol);
  range.setBackground('#1B2A4A');
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
}
