<?php
/* ------------------------------------------------------------------
   api/db.php — shared PDO connection and JSON helpers.

   This is the XAMPP/MySQL copy of the demo data. The pages keep using
   localStorage as a cache; js/sync.js loads the MySQL data into that
   cache on every page load and pushes changes back.

   Defaults are the stock XAMPP ones (user "root", no password). If your
   MySQL account is different, change the three constants below.
   Import/see the data in phpMyAdmin: http://localhost/phpmyadmin
   ------------------------------------------------------------------ */

declare(strict_types=1);

const SP_DB_HOST = '127.0.0.1';
const SP_DB_USER = 'root';
const SP_DB_PASS = '';
const SP_DB_NAME = 'school_portal';

/* JSON response + exit */
function sp_json($payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sp_fail(string $message, int $status = 500): void
{
    sp_json(['ok' => false, 'message' => $message], $status);
}

/* request body decoded as an associative array */
function sp_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw === false ? '' : $raw, true);
    return is_array($data) ? $data : [];
}

/* connection, created database and tables on first use */
function sp_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO(
            'mysql:host=' . SP_DB_HOST . ';charset=utf8mb4',
            SP_DB_USER,
            SP_DB_PASS,
            $options
        );

        $pdo->exec(
            'CREATE DATABASE IF NOT EXISTS `' . SP_DB_NAME . '` '
            . 'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
        );
        $pdo->exec('USE `' . SP_DB_NAME . '`');

        sp_install($pdo);
    } catch (PDOException $e) {
        sp_fail(
            'Cannot connect to MySQL. Start Apache and MySQL in the XAMPP '
            . 'Control Panel, then reload. (' . $e->getMessage() . ')',
            500
        );
    }

    return $pdo;
}

/* schema — created only when missing, so existing rows are kept */
function sp_install(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admins (
            id VARCHAR(32) NOT NULL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            password VARCHAR(120) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS teachers (
            id VARCHAR(32) NOT NULL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            password VARCHAR(120) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS students (
            id VARCHAR(32) NOT NULL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            password VARCHAR(120) NOT NULL,
            section_id VARCHAR(64) NOT NULL DEFAULT \'\'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS classes (
            id VARCHAR(64) NOT NULL PRIMARY KEY,
            section VARCHAR(120) NOT NULL,
            subject VARCHAR(120) NOT NULL,
            room VARCHAR(120) NOT NULL,
            time VARCHAR(120) NOT NULL,
            days VARCHAR(120) NOT NULL,
            teacher_id VARCHAR(32) NOT NULL DEFAULT \'\'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS class_students (
            class_id VARCHAR(64) NOT NULL,
            student_id VARCHAR(32) NOT NULL,
            PRIMARY KEY (class_id, student_id),
            KEY idx_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    /* attendance / grades / announcements, one JSON blob per teacher */
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS teacher_data (
            teacher_id VARCHAR(32) NOT NULL PRIMARY KEY,
            data LONGTEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP '
            . 'ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}
