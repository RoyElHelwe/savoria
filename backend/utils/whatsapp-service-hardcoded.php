<?php
/**
 * WhatsApp Messaging Service for Savoria Restaurant
 * 
 * Provides functions to send WhatsApp messages to customers
 * using the UltraMsg API with hardcoded credentials and improved
 * timeout handling
 */

// Hardcoded API credentials
define('WHATSAPP_APIKEY', 'wxg43zzf4amd1cur');
define('ULTRAMSG_INSTANCE', 'instance120861');

// Set a shorter timeout for API calls
define('API_TIMEOUT', 15); // 15 seconds timeout

/**
 * Sends a WhatsApp message to the specified number
 * @param string $whatsappNumber - The WhatsApp number to send to (include country code)
 * @param string $message - The message to send
 * @return array - Result of the API call
 */
function sendWhatsAppMessage($whatsappNumber, $message) {
    $apiKey = WHATSAPP_APIKEY;
    $instanceId = ULTRAMSG_INSTANCE;
    
    error_log("[WhatsApp Service] Attempting to send message to $whatsappNumber");
    
    // Format the phone number (remove any spaces and ensure it has no + prefix)
    $formattedNumber = str_replace(' ', '', $whatsappNumber);
    $phoneNumber = substr($formattedNumber, 0, 1) === '+' 
        ? substr($formattedNumber, 1) 
        : $formattedNumber;

    // Check if number is valid
    if (!preg_match('/^\d{7,15}$/', $phoneNumber)) {
        error_log("[WhatsApp Service] Invalid phone number format: $phoneNumber");
        return ['success' => false, 'error' => "Invalid phone number format: $phoneNumber"];
    }
    
    $url = "https://api.ultramsg.com/{$instanceId}/messages/chat";
    
    try {
        error_log("[WhatsApp Service] Sending request to $url");
        
        // Prepare cURL request with shorter timeout
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 2,
            CURLOPT_TIMEOUT => API_TIMEOUT, // Short timeout
            CURLOPT_CONNECTTIMEOUT => 5,    // Even shorter connect timeout
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => json_encode([
                'token' => $apiKey,
                'to' => $phoneNumber,
                'body' => $message,
                'priority' => 10, // High priority
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ],
        ]);
        
        $response = curl_exec($curl);
        $error = curl_error($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlInfo = curl_getinfo($curl);
        
        curl_close($curl);
        
        // Log connection details for troubleshooting
        error_log("[WhatsApp Service] Connection info: " . 
            "Time: " . $curlInfo['total_time'] . "s, " .
            "HTTP code: " . $httpCode);
        
        if ($error) {
            error_log("[WhatsApp Service] cURL Error: $error");
            return ['success' => false, 'error' => "cURL Error: $error"];
        }
        
        if ($httpCode < 200 || $httpCode >= 300) {
            error_log("[WhatsApp Service] HTTP Error: $httpCode, Response: $response");
            return ['success' => false, 'error' => "HTTP Error: $httpCode"];
        }
        
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('[WhatsApp Service] Error parsing JSON response: ' . json_last_error_msg());
            return ['success' => false, 'error' => 'Failed to parse API response'];
        }
        
        error_log('[WhatsApp Service] Message sent successfully');
        return ['success' => true, 'data' => $data];
    } catch (Exception $e) {
        error_log('[WhatsApp Service] Error sending message: ' . $e->getMessage());
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

/**
 * Safe version of sendWhatsAppMessage that doesn't throw exceptions
 * and has a timeout to prevent PHP from hanging
 * 
 * @param string $whatsappNumber - The WhatsApp number to send to
 * @param string $message - The message to send
 * @return array - Result with success/error information
 */
function safeSendWhatsAppMessage($whatsappNumber, $message) {
    // Set a time limit for this function
    set_time_limit(30); // 30 seconds max
    
    try {
        return sendWhatsAppMessage($whatsappNumber, $message);
    } catch (Exception $e) {
        error_log('[WhatsApp Service] Error in safeSendWhatsAppMessage: ' . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Failed to send WhatsApp message: ' . $e->getMessage()
        ];
    }
}

/**
 * Sends reservation confirmation message
 * @param string $whatsappNumber - The WhatsApp number to send to
 * @param string $name - The customer's name
 * @param string $date - The reservation date
 * @param string $time - The reservation time
 * @param int $guests - The number of guests
 * @return array - Result of the API call
 */
function sendReservationConfirmationMessage($whatsappNumber, $name, $date, $time, $guests) {
    $message = "
🍽️ *Reservation Confirmed!* 🍽️

Hello {$name},

Your reservation at Savoria Restaurant has been confirmed!

📅 *Date:* {$date}
🕒 *Time:* {$time}
👥 *Guests:* {$guests}

We look forward to welcoming you!

_If you need to make any changes or cancel your reservation, please call us at (123) 456-7890 or visit our website._

Thank you for choosing Savoria!
";

    return safeSendWhatsAppMessage($whatsappNumber, $message);
}

/**
 * Sends reservation cancellation message
 * @param string $whatsappNumber - The WhatsApp number to send to
 * @param string $name - The customer's name
 * @param string $date - The reservation date
 * @param string $time - The reservation time
 * @param string $reason - Optional reason for cancellation
 * @return array - Result of the API call
 */
function sendReservationCancellationMessage($whatsappNumber, $name, $date, $time, $reason = null) {
    $reasonText = $reason ? "\nReason: {$reason}" : '';
    
    $message = "
❌ *Reservation Cancelled* ❌

Hello {$name},

Your reservation at Savoria Restaurant for {$date} at {$time} has been cancelled.{$reasonText}

If this was a mistake or you'd like to make a new reservation, please visit our website or call us at (123) 456-7890.

Thank you for your understanding.
";

    return safeSendWhatsAppMessage($whatsappNumber, $message);
}

/**
 * Sends reservation reminder message
 * @param string $whatsappNumber - The WhatsApp number to send to
 * @param string $name - The customer's name
 * @param string $date - The reservation date
 * @param string $time - The reservation time
 * @param int $guests - The number of guests
 * @return array - Result of the API call
 */
function sendReservationReminderMessage($whatsappNumber, $name, $date, $time, $guests) {
    $message = "
🔔 *Reservation Reminder* 🔔

Hello {$name},

This is a friendly reminder about your upcoming reservation at Savoria Restaurant.

📅 *Date:* {$date}
🕒 *Time:* {$time}
👥 *Guests:* {$guests}

We look forward to serving you soon!

_If you need to make any changes, please call us at (123) 456-7890._

See you soon!
";

    return safeSendWhatsAppMessage($whatsappNumber, $message);
}