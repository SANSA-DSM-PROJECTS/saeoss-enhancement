<?php
// Set header to JSON
header('Content-Type: application/json');

// Get raw POST data
$data = json_decode(file_get_contents('php://input'), true);

// Database config
$host = 'localhost';
$dbname = 'datastore';
$user = 'alamba';
$pass = 'lamba';

// Connect to PostgreSQL
try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed']);
    exit;
}

// Insert data
$sql = "INSERT INTO users (fullname, email, phone, date, site, attendees)
        VALUES (:fullname, :email, :phone, :date, :site, :attendees)";

$stmt = $pdo->prepare($sql);
$result = $stmt->execute([
    ':fullname' => $data['fullname'],
    ':email' => $data['email'],
    ':phone' => $data['phone'],
    ':date' => $data['date'],
    ':site' => $data['site'],
    ':attendees' => $data['attendees']
]);

if ($result) {
    echo json_encode(['message' => 'Form submitted successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to submit form']);
}

