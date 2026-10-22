<?php
/* ------------------------------------------------------------------
   api/student-grades.php — one student's quarter grades, taken from the
   grade book of the teacher assigned to their classroom.

   GET ?id=2026-0701 → { ok, grades, subject, section, teacher }
   grades is null when the student is not in a classroom; each quarter is
   null until the teacher posts a score.

   Only this student's row is returned, not the class's whole grade book.
   ------------------------------------------------------------------ */

require __DIR__ . '/db.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sp_fail('Only GET is supported.', 405);
}

$pdo = sp_pdo();
$id = substr(trim((string) ($_GET['id'] ?? '')), 0, 32);

if ($id === '') {
    sp_fail('Missing student id.', 400);
}

$stmt = $pdo->prepare('SELECT id, name FROM students WHERE id = ?');
$stmt->execute([$id]);
$student = $stmt->fetch();

if ($student === false) {
    sp_json([
        'ok' => true,
        'grades' => null,
        'subject' => null,
        'section' => null,
        'teacher' => null,
        'message' => 'No student account found for that ID.',
    ]);
}

$stmt = $pdo->prepare(
    'SELECT c.id AS class_id, c.subject, c.section, c.teacher_id, t.name AS teacher_name '
    . 'FROM class_students cs '
    . 'JOIN classes c ON c.id = cs.class_id '
    . 'LEFT JOIN teachers t ON t.id = c.teacher_id '
    . 'WHERE cs.student_id = ? LIMIT 1'
);
$stmt->execute([$student['id']]);
$class = $stmt->fetch();

if ($class === false) {
    sp_json([
        'ok' => true,
        'grades' => null,
        'subject' => null,
        'section' => null,
        'teacher' => null,
    ]);
}

$grades = ['q1' => null, 'q2' => null, 'q3' => null, 'q4' => null];

if ($class['teacher_id'] !== '') {
    $stmt = $pdo->prepare('SELECT data FROM teacher_data WHERE teacher_id = ?');
    $stmt->execute([strtoupper($class['teacher_id'])]);
    $row = $stmt->fetch();

    if ($row !== false) {
        $saved = json_decode($row['data'], true);
        $mine = $saved['grades'][$class['class_id']][$student['id']] ?? null;

        if (is_array($mine)) {
            foreach (['q1', 'q2', 'q3', 'q4'] as $quarter) {
                if (isset($mine[$quarter]) && $mine[$quarter] !== '') {
                    $grades[$quarter] = $mine[$quarter];
                }
            }
        }
    }
}

sp_json([
    'ok' => true,
    'grades' => $grades,
    'subject' => $class['subject'],
    'section' => $class['section'],
    'teacher' => $class['teacher_name'],
]);
