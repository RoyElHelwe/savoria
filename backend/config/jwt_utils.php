<?php
/**
 * JWT Utilities for Savoria Restaurant Website
 */

// JWT Secret Key (change this in production and keep it secure)
define('JWT_SECRET', 'your_jwt_secret_key_change_in_production');
define('JWT_EXPIRY', 3600); // 1 hour in seconds

/**
 * Generate a JWT token
 * 
 * @param array $payload Data to be encoded in the JWT
 * @return string JWT token
 */
function generateJWT($payload) {
    // Header
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT'
    ];
    
    // Add expiry to payload
    $payload['exp'] = time() + JWT_EXPIRY;
    $payload['iat'] = time(); // Issued at
    
    // Encode Header
    $header_encoded = base64UrlEncode(json_encode($header));
    
    // Encode Payload
    $payload_encoded = base64UrlEncode(json_encode($payload));
    
    // Create Signature
    $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", JWT_SECRET, true);
    $signature_encoded = base64UrlEncode($signature);
    
    // Create JWT
    $jwt = "$header_encoded.$payload_encoded.$signature_encoded";
    
    return $jwt;
}

/**
 * Validate a JWT token
 * 
 * @param string $jwt JWT token to validate
 * @return array|bool Payload data if valid, false otherwise
 */
function validateJWT($jwt) {
    // Split the JWT
    $tokenParts = explode('.', $jwt);
    
    // Check if the token has 3 parts
    if (count($tokenParts) != 3) {
        return false;
    }
    
    list($header_encoded, $payload_encoded, $signature_encoded) = $tokenParts;
    
    // Verify signature
    $signature = base64UrlDecode($signature_encoded);
    $expectedSignature = hash_hmac('sha256', "$header_encoded.$payload_encoded", JWT_SECRET, true);
    
    if (!hash_equals($signature, $expectedSignature)) {
        return false;
    }
    
    // Decode payload
    $payload = json_decode(base64UrlDecode($payload_encoded), true);
    
    // Check if token has expired
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

/**
 * Base64 URL encode
 * 
 * @param string $data Data to encode
 * @return string Base64 URL encoded string
 */
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL decode
 * 
 * @param string $data Data to decode
 * @return string Decoded data
 */
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Get JWT from Authorization header
 * 
 * @return string|null JWT token or null if not found
 */
function getJWTFromHeader() {
    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
        return null;
    }
    
    $authHeader = $headers['Authorization'];
    
    // Check if the Authorization header starts with "Bearer "
    if (strpos($authHeader, 'Bearer ') !== 0) {
        return null;
    }
    
    // Extract the token
    return substr($authHeader, 7);
}

/**
 * Authenticate user with JWT
 * 
 * @return array|bool User data if authenticated, false otherwise
 */
function authenticateUser() {
    $jwt = getJWTFromHeader();
    
    if (!$jwt) {
        return false;
    }
    
    return validateJWT($jwt);
}

/**
 * Check if user has required role
 * 
 * @param string|array $requiredRoles Required role(s)
 * @param array $userData User data from JWT
 * @return bool True if user has required role, false otherwise
 */
function hasRole($requiredRoles, $userData) {
    if (!isset($userData['role'])) {
        return false;
    }
    
    $userRole = $userData['role'];
    
    // If requiredRoles is a string, convert to array
    if (!is_array($requiredRoles)) {
        $requiredRoles = [$requiredRoles];
    }
    
    // Map roles to numeric values for hierarchy
    $roleValues = [
        'customer' => 1,
        'staff' => 2,
        'manager' => 3,
        'admin' => 4
    ];
    
    $userRoleValue = $roleValues[$userRole] ?? 0;
    
    // Check if user has any of the required roles
    foreach ($requiredRoles as $role) {
        $requiredValue = $roleValues[$role] ?? 0;
        
        // Admin can do anything
        if ($userRole === 'admin') {
            return true;
        }
        
        // Exact role match
        if ($userRole === $role) {
            return true;
        }
        
        // Manager can do staff roles
        if ($userRole === 'manager' && $role === 'staff') {
            return true;
        }
    }
    
    return false;
} 