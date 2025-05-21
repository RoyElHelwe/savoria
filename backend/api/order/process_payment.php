<?php
/**
 * Process Payment API
 * 
 * Handles credit card payment processing (fake/simulated)
 * For real implementations, you would integrate with a payment gateway
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Include database and authentication utilities
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt_utils.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("HTTP/1.1 405 Method Not Allowed");
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Get POST data
$data = json_decode(file_get_contents("php://input"));

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Check if data is valid
if (!isset($data->card_number) || !isset($data->expiry_date) || !isset($data->cvv) || !isset($data->amount)) {
    exit(json_encode([
        'success' => false,
        'error' => 'Missing required payment information'
    ]));
}

// Sanitize inputs
$cardNumber = preg_replace('/\s+/', '', $data->card_number);
$expiryDate = $data->expiry_date;
$cvv = $data->cvv;
$amount = floatval($data->amount);
$cardHolder = isset($data->card_holder) ? $data->card_holder : '';

// Basic validation
if (strlen($cardNumber) !== 16 || !is_numeric($cardNumber)) {
    exit(json_encode([
        'success' => false,
        'error' => 'Invalid card number'
    ]));
}

// Validate expiry date (MM/YY format)
if (!preg_match('/^(0[1-9]|1[0-2])\/([0-9]{2})$/', $expiryDate)) {
    exit(json_encode([
        'success' => false,
        'error' => 'Invalid expiry date format. Use MM/YY'
    ]));
}

// Check if card is expired
list($month, $year) = explode('/', $expiryDate);
$expiryDate = \DateTime::createFromFormat('m/y', $month . '/' . $year);
$now = new \DateTime();

if ($expiryDate < $now) {
    exit(json_encode([
        'success' => false,
        'error' => 'Card has expired'
    ]));
}

// Validate CVV (3-4 digits)
if (!is_numeric($cvv) || strlen($cvv) < 3 || strlen($cvv) > 4) {
    exit(json_encode([
        'success' => false,
        'error' => 'Invalid CVV'
    ]));
}

// In a real implementation, you would call your payment gateway API here
// For demo purposes, we'll simulate success based on certain conditions

// Get user ID if token is provided
$userId = null;
$token = getJWTFromHeader();

if ($token) {
    $payload = validateJWT($token);
    if ($payload && isset($payload['user_id'])) {
        $userId = $payload['user_id'];
    }
}

// Simulate payment processing
// For testing: Cards starting with '4' always succeed, others have a 30% chance of failure
$isSuccess = (substr($cardNumber, 0, 1) === '4') || (rand(1, 10) <= 7);

// Generate a transaction reference
$transactionId = 'TXN' . time() . rand(1000, 9999);

// Get last 4 digits of card
$cardLast4 = substr($cardNumber, -4);

if ($isSuccess) {
    // In a real app, store payment details securely
    if ($userId) {
        // For logged-in users, you could store their payment method
        // (In a production system, never store full card details - only tokens from your payment provider)
        try {
            $stmt = $conn->prepare("INSERT INTO payment_transactions 
                                   (user_id, transaction_id, amount, payment_method, card_last4, status) 
                                   VALUES (?, ?, ?, 'credit_card', ?, 'completed')");
            
            $stmt->bind_param("isds", $userId, $transactionId, $amount, $cardLast4);
            $stmt->execute();
        } catch (Exception $e) {
            // Log error but don't fail the transaction (this is just for record keeping)
            error_log("Error saving payment record: " . $e->getMessage());
        }
    }
    
    // Success response
    echo json_encode([
        'success' => true,
        'transaction_id' => $transactionId,
        'card_last4' => $cardLast4,
        'amount' => $amount,
        'message' => 'Payment processed successfully'
    ]);
} else {
    // Simulate different error scenarios for educational purposes
    $errorCodes = [
        'insufficient_funds',
        'card_declined',
        'processing_error',
        'expired_card',
        'invalid_cvc'
    ];
    
    $errorCode = $errorCodes[array_rand($errorCodes)];
    $errorMessages = [
        'insufficient_funds' => 'Insufficient funds',
        'card_declined' => 'Card was declined',
        'processing_error' => 'An error occurred while processing the payment',
        'expired_card' => 'The card has expired',
        'invalid_cvc' => 'Invalid security code'
    ];
    
    // Record failed transaction
    try {
        $stmt = $conn->prepare("INSERT INTO payment_transactions 
                               (user_id, transaction_id, amount, payment_method, card_last4, status, error_code) 
                               VALUES (?, ?, ?, 'credit_card', ?, 'failed', ?)");
        
        $stmt->bind_param("isdss", $userId, $transactionId, $amount, $cardLast4, $errorCode);
        $stmt->execute();
    } catch (Exception $e) {
        // Log error
        error_log("Error saving failed payment record: " . $e->getMessage());
    }
    
    // Error response
    echo json_encode([
        'success' => false,
        'error_code' => $errorCode,
        'error' => $errorMessages[$errorCode],
        'transaction_id' => $transactionId
    ]);
}