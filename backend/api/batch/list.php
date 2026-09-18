<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendJsonResponse(['success' => false, 'message' => 'Method not allowed. Use GET.'], 405);
try {
    $rows = $pdo->query('SELECT id, batch_name, initial_birds, start_date, created_at FROM batches ORDER BY start_date DESC, id DESC')->fetchAll();
    foreach ($rows as &$row) { $row['id'] = (int)$row['id']; $row['initial_birds'] = (int)$row['initial_birds']; }
    unset($row);
    sendJsonResponse(['success' => true, 'count' => count($rows), 'data' => $rows]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    sendJsonResponse(['success' => false, 'message' => 'Unable to retrieve batches.'], 500);
}
