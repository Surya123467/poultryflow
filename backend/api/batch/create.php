<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJsonResponse(['success' => false, 'message' => 'Method not allowed. Use POST.'], 405);
$data = readJsonBody();
$name = trim((string)($data['batch_name'] ?? ''));
$birds = filter_var($data['initial_birds'] ?? null, FILTER_VALIDATE_INT);
$date = trim((string)($data['start_date'] ?? ''));
if ($name === '' || mb_strlen($name) > 100) sendJsonResponse(['success' => false, 'message' => 'Batch name must contain 1 to 100 characters.'], 422);
if ($birds === false || $birds <= 0) sendJsonResponse(['success' => false, 'message' => 'Initial birds must be a positive integer.'], 422);
if (!validDate($date)) sendJsonResponse(['success' => false, 'message' => 'Start date must use YYYY-MM-DD format.'], 422);
try {
    $stmt = $pdo->prepare('INSERT INTO batches (batch_name, initial_birds, start_date) VALUES (:name, :birds, :date)');
    $stmt->execute([':name' => $name, ':birds' => $birds, ':date' => $date]);
    sendJsonResponse(['success' => true, 'message' => 'Batch created successfully.', 'data' => ['id' => (int)$pdo->lastInsertId(), 'batch_name' => $name, 'initial_birds' => $birds, 'start_date' => $date]], 201);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    sendJsonResponse(['success' => false, 'message' => 'Unable to create batch.'], 500);
}
