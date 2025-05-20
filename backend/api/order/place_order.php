<?php
/**
 * Place Order API
 * 
 * Processes new orders from customers
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
if (!isset($data->items) || !is_array($data->items) || empty($data->items)) {
    exit(json_encode([
        'success' => false,
        'error' => 'No items provided in the order'
    ]));
}

// Check if customer info is provided
if (!isset($data->customer_info) || !is_object($data->customer_info)) {
    exit(json_encode([
        'success' => false,
        'error' => 'Customer information is required'
    ]));
}

$customer = $data->customer_info;

// Required customer fields
$requiredFields = ['name', 'email', 'phone', 'address'];
foreach ($requiredFields as $field) {
    if (!isset($customer->$field) || empty(trim($customer->$field))) {
        exit(json_encode([
            'success' => false,
            'error' => "Customer $field is required"
        ]));
    }
}

// Get user ID if token is provided
$userId = null;
$token = getJWTFromHeader();

if ($token) {
    $payload = validateJWT($token);
    if ($payload && isset($payload['user_id'])) {
        $userId = $payload['user_id'];
    }
}

// Start transaction
$conn->begin_transaction();

try {
    // Calculate order total and validate items
    $totalAmount = 0;
    $validatedItems = [];

    foreach ($data->items as $item) {
        if (!isset($item->item_id) || !isset($item->quantity)) {
            throw new Exception('Invalid item in order: item_id and quantity are required');
        }

        // Validate item exists and get current price
        $itemQuery = "SELECT item_id, name, price, is_active FROM menu_items WHERE item_id = ?";
        $itemStmt = $conn->prepare($itemQuery);
        $itemStmt->bind_param("i", $item->item_id);
        $itemStmt->execute();
        $itemResult = $itemStmt->get_result();
        
        if ($itemResult->num_rows === 0) {
            throw new Exception("Item with ID {$item->item_id} not found");
        }
        
        $menuItem = $itemResult->fetch_assoc();
        
        if (!$menuItem['is_active']) {
            throw new Exception("Item '{$menuItem['name']}' is no longer available");
        }
        
        $itemTotal = $menuItem['price'] * $item->quantity;
        $totalAmount += $itemTotal;
        
        $validatedItems[] = [
            'item_id' => $item->item_id,
            'quantity' => $item->quantity,
            'price' => $menuItem['price']
        ];
    }
    
    // Set order type, default to delivery
    $orderType = isset($data->order_type) && in_array($data->order_type, ['delivery', 'pickup', 'dine-in']) 
        ? $data->order_type 
        : 'delivery';
    
    // Set payment method, default to cash
    $paymentMethod = isset($data->payment_method) && in_array($data->payment_method, ['cash', 'credit_card', 'debit_card', 'paypal', 'other']) 
        ? $data->payment_method 
        : 'cash';
    
    // Set payment status, default to pending
    $paymentStatus = 'pending';
    
    // Add delivery fee if applicable
    $deliveryFee = 0;
    if ($orderType === 'delivery') {
        // Get delivery fee from settings
        $settingsQuery = "SELECT value FROM settings WHERE name = 'delivery_fee'";
        $settingsStmt = $conn->prepare($settingsQuery);
        $settingsStmt->execute();
        $settingsResult = $settingsStmt->get_result();
        
        if ($settingsResult->num_rows > 0) {
            $deliveryFee = (float) $settingsResult->fetch_assoc()['value'];
        } else {
            // Default delivery fee
            $deliveryFee = 5.00;
        }
        
        $totalAmount += $deliveryFee;
    }
    
    // Calculate tax
    $taxRate = 0;
    $taxQuery = "SELECT value FROM settings WHERE name = 'tax_rate'";
    $taxStmt = $conn->prepare($taxQuery);
    $taxStmt->execute();
    $taxResult = $taxStmt->get_result();
    
    if ($taxResult->num_rows > 0) {
        $taxRate = (float) $taxResult->fetch_assoc()['value'];
    } else {
        // Default tax rate of 8.5%
        $taxRate = 8.5;
    }
    
    $taxAmount = ($totalAmount * $taxRate) / 100;
    $totalAmount += $taxAmount;
    
    // Insert order
    $orderQuery = "INSERT INTO orders (
                    user_id, 
                    order_type, 
                    status, 
                    total_amount, 
                    payment_method, 
                    payment_status, 
                    delivery_address,
                    delivery_fee,
                    tax_amount,
                    notes
                ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)";
    
    $notes = isset($customer->delivery_instructions) ? $customer->delivery_instructions : null;
    
    $orderStmt = $conn->prepare($orderQuery);
    $orderStmt->bind_param(
        "isdsssdds",
        $userId,
        $orderType,
        $totalAmount,
        $paymentMethod,
        $paymentStatus,
        $customer->address,
        $deliveryFee,
        $taxAmount,
        $notes
    );
    
    if (!$orderStmt->execute()) {
        throw new Exception("Failed to create order: " . $orderStmt->error);
    }
    
    $orderId = $conn->insert_id;
    
    // Insert order items
    $itemInsertQuery = "INSERT INTO order_items (
                            order_id, 
                            item_id, 
                            quantity, 
                            price_per_unit,
                            special_instructions
                        ) VALUES (?, ?, ?, ?, ?)";
    
    $itemStmt = $conn->prepare($itemInsertQuery);
    
    foreach ($validatedItems as $item) {
        $instructions = isset($item['special_instructions']) ? $item['special_instructions'] : null;
        
        $itemStmt->bind_param(
            "iiids",
            $orderId,
            $item['item_id'],
            $item['quantity'],
            $item['price'],
            $instructions
        );
        
        if (!$itemStmt->execute()) {
            throw new Exception("Failed to add item to order: " . $itemStmt->error);
        }
    }
    
    // If not authenticated user, create or update customer in the database
    if (!$userId) {
        // Check if customer exists by email        
        $customerQuery = "SELECT id FROM users WHERE email = ?";
        $customerStmt = $conn->prepare($customerQuery);
        $customerStmt->bind_param("s", $customer->email);
        $customerStmt->execute();
        $customerResult = $customerStmt->get_result();
        
        if ($customerResult->num_rows > 0) {
            // Update existing customer
            $userId = $customerResult->fetch_assoc()['id'];
            
            $updateQuery = "UPDATE users SET 
                            phone = COALESCE(?, phone),
                            address = COALESCE(?, address),
                            updated_at = NOW()
                            WHERE id = ?";
            
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bind_param("ssi", $customer->phone, $customer->address, $userId);
            $updateStmt->execute();
        } else {
            // Create guest order entry in the customers table
            // We could also store this in a separate guest_orders table
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'order_id' => $orderId,
        'total_amount' => $totalAmount,
        'message' => 'Order placed successfully'
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} 