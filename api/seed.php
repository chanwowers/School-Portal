<?php
/* ------------------------------------------------------------------
   api/seed.php — the starting records for the MySQL database.

   This mirrors the demo data that js/store.js used to seed localStorage,
   so a fresh XAMPP install starts with the same three sections, two
   teachers and 32 student accounts.

   Demo only: passwords are plain text so the administrator can view
   them. A real portal must store password hashes instead.
   ------------------------------------------------------------------ */

function sp_seed_data(): array
{
    $teachers = [
        ['id' => 'EMP-00231', 'name' => 'Ms. C. Bautista', 'password' => 'teacher123'],
        ['id' => 'EMP-00312', 'name' => 'Mr. A. Villanueva', 'password' => 'teacher123'],
    ];

    $classes = [
        [
            'id' => 'math7-rizal',
            'section' => 'Grade 7 – Rizal',
            'subject' => 'Mathematics 7',
            'room' => 'Room 201',
            'time' => '7:30 – 8:30 AM',
            'days' => 'Mon–Fri',
            'teacherId' => 'EMP-00231',
            'students' => [
                ['id' => '2026-0701', 'name' => 'Aguilar, Maria Sofia'],
                ['id' => '2026-0702', 'name' => 'Bautista, John Paul'],
                ['id' => '2026-0703', 'name' => 'Cruz, Angela Mae'],
                ['id' => '2026-0704', 'name' => 'Dela Cruz, Rafael'],
                ['id' => '2026-0705', 'name' => 'Garcia, Nicole Anne'],
                ['id' => '2026-0706', 'name' => 'Hernandez, Miguel'],
                ['id' => '2026-0707', 'name' => 'Iglesia, Bea Kristine'],
                ['id' => '2026-0708', 'name' => 'Javier, Luis Antonio'],
                ['id' => '2026-0709', 'name' => 'Mendoza, Patricia'],
                ['id' => '2026-0710', 'name' => 'Navarro, Daniel'],
                ['id' => '2026-0711', 'name' => 'Ocampo, Jasmine'],
                ['id' => '2026-0712', 'name' => 'Reyes, Carlo Miguel'],
            ],
        ],
        [
            'id' => 'math8-bonifacio',
            'section' => 'Grade 8 – Bonifacio',
            'subject' => 'Mathematics 8',
            'room' => 'Room 204',
            'time' => '9:30 – 10:30 AM',
            'days' => 'Mon–Fri',
            'teacherId' => 'EMP-00231',
            'students' => [
                ['id' => '2026-0801', 'name' => 'Aquino, Bianca'],
                ['id' => '2026-0802', 'name' => 'Bernardo, Joshua'],
                ['id' => '2026-0803', 'name' => 'Castillo, Andrea'],
                ['id' => '2026-0804', 'name' => 'Domingo, Mark Angelo'],
                ['id' => '2026-0805', 'name' => 'Espinosa, Carla'],
                ['id' => '2026-0806', 'name' => 'Fernandez, Paolo'],
                ['id' => '2026-0807', 'name' => 'Gonzales, Rhea'],
                ['id' => '2026-0808', 'name' => 'Lim, Kevin'],
                ['id' => '2026-0809', 'name' => 'Manalo, Sophia'],
                ['id' => '2026-0810', 'name' => 'Ortega, Gabriel'],
            ],
        ],
        [
            'id' => 'math9-mabini',
            'section' => 'Grade 9 – Mabini',
            'subject' => 'Mathematics 9',
            'room' => 'Room 302',
            'time' => '1:00 – 2:00 PM',
            'days' => 'Mon–Fri',
            'teacherId' => 'EMP-00231',
            'students' => [
                ['id' => '2026-0901', 'name' => 'Abad, Isabella'],
                ['id' => '2026-0902', 'name' => 'Buenaventura, Nathan'],
                ['id' => '2026-0903', 'name' => 'Cortez, Camille'],
                ['id' => '2026-0904', 'name' => 'Dizon, Adrian'],
                ['id' => '2026-0905', 'name' => 'Evangelista, Kyla'],
                ['id' => '2026-0906', 'name' => 'Flores, Rafael'],
                ['id' => '2026-0907', 'name' => 'Gutierrez, Marielle'],
                ['id' => '2026-0908', 'name' => 'Herrera, Lorenzo'],
                ['id' => '2026-0909', 'name' => 'Ignacio, Zoe'],
                ['id' => '2026-0910', 'name' => 'Jimenez, Paolo'],
            ],
        ],
    ];

    $students = [];
    $storedClasses = [];

    foreach ($classes as $class) {
        $studentIds = [];

        foreach ($class['students'] as $student) {
            $students[] = [
                'id' => $student['id'],
                'name' => $student['name'],
                'password' => 'student123',
                'sectionId' => $class['id'],
            ];
            $studentIds[] = $student['id'];
        }

        $storedClasses[] = [
            'id' => $class['id'],
            'section' => $class['section'],
            'subject' => $class['subject'],
            'room' => $class['room'],
            'time' => $class['time'],
            'days' => $class['days'],
            'teacherId' => $class['teacherId'],
            'studentIds' => $studentIds,
        ];
    }

    return [
        'version' => 1,
        'admin' => [
            'id' => 'ADMIN-0001',
            'name' => 'School Administrator',
            'password' => 'admin123',
        ],
        'teachers' => $teachers,
        'students' => $students,
        'classes' => $storedClasses,
    ];
}
