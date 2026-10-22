<?php
/* ------------------------------------------------------------------
   api/store.php — the shared school database (admin, teachers,
   students, classes) stored in MySQL instead of only localStorage.

   GET  → { ok, fresh, store }   fresh is true when the database was
          empty and has just been seeded.
   POST → replaces the whole store with the JSON body. The admin pages
          call this after every change, so MySQL is the shared copy and
          localStorage is just the page cache.

   DEMO ONLY: passwords are plain text so the administrator can reveal
   them, exactly as requested for this prototype.
   ------------------------------------------------------------------ */

require __DIR__ . '/db.php';
require __DIR__ . '/seed.php';

function sp_store_id($value): string
{
    return substr(trim((string) $value), 0, 32);
}

function sp_store_text($value, int $max): string
{
    return substr(trim((string) $value), 0, $max);
}

function sp_store_read(PDO $pdo): array
{
    $admin = $pdo->query('SELECT id, name, password FROM admins LIMIT 1')->fetch();
    $teachers = $pdo->query('SELECT id, name, password FROM teachers ORDER BY name')->fetchAll();
    $students = $pdo->query(
        'SELECT id, name, password, section_id FROM students ORDER BY name'
    )->fetchAll();
    $classes = $pdo->query(
        'SELECT id, section, subject, room, time, days, teacher_id '
        . 'FROM classes ORDER BY section'
    )->fetchAll();
    $links = $pdo->query('SELECT class_id, student_id FROM class_students')->fetchAll();

    $rosters = [];
    foreach ($links as $link) {
        $rosters[$link['class_id']][] = $link['student_id'];
    }

    return [
        'version' => 1,
        'admin' => $admin === false ? null : [
            'id' => $admin['id'],
            'name' => $admin['name'],
            'password' => $admin['password'],
        ],
        'teachers' => array_map(static function (array $teacher): array {
            return [
                'id' => $teacher['id'],
                'name' => $teacher['name'],
                'password' => $teacher['password'],
            ];
        }, $teachers),
        'students' => array_map(static function (array $student): array {
            return [
                'id' => $student['id'],
                'name' => $student['name'],
                'password' => $student['password'],
                'sectionId' => $student['section_id'],
            ];
        }, $students),
        'classes' => array_map(static function (array $class) use ($rosters): array {
            return [
                'id' => $class['id'],
                'section' => $class['section'],
                'subject' => $class['subject'],
                'room' => $class['room'],
                'time' => $class['time'],
                'days' => $class['days'],
                'teacherId' => $class['teacher_id'],
                'studentIds' => $rosters[$class['id']] ?? [],
            ];
        }, $classes),
    ];
}

function sp_store_write(PDO $pdo, array $store): void
{
    $admin = isset($store['admin']) && is_array($store['admin']) ? $store['admin'] : null;
    $teachers = isset($store['teachers']) && is_array($store['teachers']) ? $store['teachers'] : [];
    $students = isset($store['students']) && is_array($store['students']) ? $store['students'] : [];
    $classes = isset($store['classes']) && is_array($store['classes']) ? $store['classes'] : [];

    $pdo->beginTransaction();

    try {
        $pdo->exec('DELETE FROM class_students');
        $pdo->exec('DELETE FROM classes');
        $pdo->exec('DELETE FROM students');
        $pdo->exec('DELETE FROM teachers');
        $pdo->exec('DELETE FROM admins');

        if ($admin !== null && sp_store_id($admin['id'] ?? '') !== '') {
            $stmt = $pdo->prepare('INSERT INTO admins (id, name, password) VALUES (?, ?, ?)');
            $stmt->execute([
                sp_store_id($admin['id']),
                sp_store_text($admin['name'] ?? '', 120),
                sp_store_text($admin['password'] ?? '', 120),
            ]);
        }

        $teacherStmt = $pdo->prepare(
            'INSERT INTO teachers (id, name, password) VALUES (?, ?, ?)'
        );
        $seenTeachers = [];
        foreach ($teachers as $teacher) {
            if (!is_array($teacher)) {
                continue;
            }
            $id = sp_store_id($teacher['id'] ?? '');
            if ($id === '' || isset($seenTeachers[$id])) {
                continue;
            }
            $seenTeachers[$id] = true;
            $teacherStmt->execute([
                $id,
                sp_store_text($teacher['name'] ?? '', 120),
                sp_store_text($teacher['password'] ?? '', 120),
            ]);
        }

        $studentStmt = $pdo->prepare(
            'INSERT INTO students (id, name, password, section_id) VALUES (?, ?, ?, ?)'
        );
        $seenStudents = [];
        foreach ($students as $student) {
            if (!is_array($student)) {
                continue;
            }
            $id = sp_store_id($student['id'] ?? '');
            if ($id === '' || isset($seenStudents[$id])) {
                continue;
            }
            $seenStudents[$id] = true;
            $studentStmt->execute([
                $id,
                sp_store_text($student['name'] ?? '', 120),
                sp_store_text($student['password'] ?? '', 120),
                sp_store_id($student['sectionId'] ?? ''),
            ]);
        }

        $classStmt = $pdo->prepare(
            'INSERT INTO classes (id, section, subject, room, time, days, teacher_id) '
            . 'VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $linkStmt = $pdo->prepare(
            'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)'
        );
        $sectionStmt = $pdo->prepare('UPDATE students SET section_id = ? WHERE id = ?');

        $seenClasses = [];
        foreach ($classes as $class) {
            if (!is_array($class)) {
                continue;
            }
            $classId = sp_store_id($class['id'] ?? '');
            if ($classId === '' || isset($seenClasses[$classId])) {
                continue;
            }
            $seenClasses[$classId] = true;

            $classStmt->execute([
                $classId,
                sp_store_text($class['section'] ?? '', 120),
                sp_store_text($class['subject'] ?? '', 120),
                sp_store_text($class['room'] ?? '', 120),
                sp_store_text($class['time'] ?? '', 120),
                sp_store_text($class['days'] ?? '', 120),
                sp_store_id($class['teacherId'] ?? ''),
            ]);

            $studentIds = isset($class['studentIds']) && is_array($class['studentIds'])
                ? $class['studentIds']
                : [];
            $seenLinks = [];

            foreach ($studentIds as $studentId) {
                $studentId = sp_store_id($studentId);
                if ($studentId === ''
                    || isset($seenLinks[$studentId])
                    || !isset($seenStudents[$studentId])) {
                    continue;
                }
                $seenLinks[$studentId] = true;
                $linkStmt->execute([$classId, $studentId]);
                // keep the student's own section pointer in step with the roster
                $sectionStmt->execute([$classId, $studentId]);
            }
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

$pdo = sp_pdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $payload = sp_body();

    if (!is_array($payload['students'] ?? null) || !is_array($payload['classes'] ?? null)) {
        sp_fail('The store payload is incomplete. Send admin, teachers, students and classes.', 400);
    }

    try {
        sp_store_write($pdo, $payload);
    } catch (Throwable $e) {
        sp_fail('Could not save the store. (' . $e->getMessage() . ')', 500);
    }

    sp_json(['ok' => true]);
}

if ($method !== 'GET') {
    sp_fail('Only GET and POST are supported.', 405);
}

try {
    $fresh = ((int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn()) === 0;

    if ($fresh) {
        sp_store_write($pdo, sp_seed_data());
    }

    $store = sp_store_read($pdo);
} catch (Throwable $e) {
    sp_fail('Could not read the store. (' . $e->getMessage() . ')', 500);
}

sp_json([
    'ok' => true,
    'fresh' => $fresh,
    'store' => $store,
]);
