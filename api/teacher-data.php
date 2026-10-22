<?php
/* ------------------------------------------------------------------
   api/teacher-data.php — attendance, grades and announcements for one
   teacher, stored in MySQL as a JSON blob.

   GET  ?id=EMP-00231  → { ok, data }   data is null when nothing has
                          been saved for that teacher yet.
   POST { id, data }   → creates or replaces that teacher's data.

   The shape of "data" matches js/teacher.js:
     { attendance: { classId: { date: { studentId: status } } },
       grades:     { classId: { studentId: { q1, q2, q3, q4 } } },
       announcements: [ ... ] }
   ------------------------------------------------------------------ */

require __DIR__ . '/db.php';

$pdo = sp_pdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $payload = sp_body();
    $id = strtoupper(trim((string) ($payload['id'] ?? '')));
    $data = $payload['data'] ?? null;

    if ($id === '' || !is_array($data)) {
        sp_fail('Send a teacher id and a data object.', 400);
    }

    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        sp_fail('The teacher data could not be encoded.', 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO teacher_data (teacher_id, data) VALUES (?, ?) '
        . 'ON DUPLICATE KEY UPDATE data = VALUES(data)'
    );
    $stmt->execute([$id, $json]);

    sp_json(['ok' => true]);
}

if ($method !== 'GET') {
    sp_fail('Only GET and POST are supported.', 405);
}

$id = strtoupper(trim((string) ($_GET['id'] ?? '')));

if ($id === '') {
    sp_fail('Missing teacher id.', 400);
}

$stmt = $pdo->prepare('SELECT data FROM teacher_data WHERE teacher_id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch();

sp_json([
    'ok' => true,
    'data' => $row === false ? null : json_decode($row['data'], true),
]);
