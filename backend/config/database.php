<?php
/**
 * Database Configuration for Savoria Restaurant Website
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'savoria');
define('DB_USER', 'root'); // Change in production
define('DB_PASS', '');     // Change in production
define('DB_PORT', 3306);

/**
 * Database Class for handling connections
 */
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $port = DB_PORT;
    private $conn;
    
    /**
     * Get the database connection
     * 
     * @return mysqli The database connection
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name, $this->port);
            $this->conn->set_charset("utf8mb4");
            
            if ($this->conn->connect_error) {
                throw new Exception("Connection error: " . $this->conn->connect_error);
            }
        } catch (Exception $e) {
            error_log("Database connection error: " . $e->getMessage());
            // In production, you might want to handle this more gracefully
        }
        
        return $this->conn;
    }
}

/**
 * Create a database connection
 * 
 * @return mysqli|null Database connection or null on failure
 */
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    
    // Check connection
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        return null;
    }
    
    // Set character set
    $conn->set_charset("utf8mb4");
    
    return $conn;
}

/**
 * Execute a query and return the result
 * 
 * @param string $sql SQL query
 * @param array $params Parameters for prepared statement
 * @param string $types Types of parameters (i: integer, s: string, d: double, b: blob)
 * @return array|bool|null Query result or false on failure
 */
function executeQuery($sql, $params = [], $types = null) {
    $conn = getDbConnection();
    
    if (!$conn) {
        return null;
    }
    
    $result = false;
    
    // If no parameters, execute a simple query
    if (empty($params)) {
        $result = $conn->query($sql);
    } else {
        // Use prepared statement
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            // If types not provided, generate based on parameters
            if ($types === null) {
                $types = '';
                foreach ($params as $param) {
                    if (is_int($param)) {
                        $types .= 'i';
                    } elseif (is_float($param)) {
                        $types .= 'd';
                    } elseif (is_string($param)) {
                        $types .= 's';
                    } else {
                        $types .= 'b';
                    }
                }
            }
            
            // Bind parameters dynamically
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            
            // Execute the query
            $stmt->execute();
            
            // Get result for SELECT queries
            if (strpos(strtoupper($sql), 'SELECT') === 0) {
                $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            } else {
                $result = true;
            }
            
            $stmt->close();
        }
    }
    
    $conn->close();
    
    return $result;
}

/**
 * Get last inserted ID
 * 
 * @return int Last inserted ID
 */
function getLastInsertId() {
    $conn = getDbConnection();
    $id = $conn->insert_id;
    $conn->close();
    return $id;
} 