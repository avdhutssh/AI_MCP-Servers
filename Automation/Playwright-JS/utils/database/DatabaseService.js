// DatabaseService.js
// Database connection and query service

const mysql = require('mysql2/promise');
const { log } = require('../logger/Logger');

class DatabaseService {
    /**
     * Initialize the database service
     * @param {Object} config - Database configuration object
     */
    constructor(config) {
        this.config = config;
        this.connection = null;
    }
  
    /**
     * Establish database connection
     * @returns {Promise<boolean>} True if connection successful
     */
    async connect() {
        try {
            this.connection = await mysql.createConnection(this.config);
            log('Database connection established', 'success');
            return true;
        } catch (error) {
            log('Database connection failed: ${error.message}', 'error');
            return false;
        }
    }
  
    /**
     * Close database connection
     */
    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            log('Database connection closed', 'info');
        }
    }

    /**
     * Execute a query
     * @param {string} query - SQL query to execute
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Query results
     */
    async execute(query, params = []) {
        if (!this.connection) {
            throw new Error('Database connection not established');
        }
        
        const [rows] = await this.connection.execute(query, params);
        return rows;
    }
  
    /**
     * Fetch random registration data from database
     * @returns {Promise<Object>} Registration data object
     */
    async fetchRandomRegistrationData() {
        try {
            // Try to fetch random user from database
            if (!this.connection) {
                throw new Error('Database connection not established');
            }
      
            // Get random user from registration details
            const rows = await this.execute(
                'SELECT * FROM RegistrationDetails ORDER BY RAND() LIMIT 1'
            );
      
            if (rows.length === 0) {
                throw new Error('No records found in RegistrationDetails table');
            }
      
            const registrationData = rows[0];
      
            // Get email for this user if possible
            let email = null;
            try {
                const emailRows = await this.execute(
                    'SELECT email FROM UserNames WHERE id_number = ?',
                    [registrationData.id_number]
                );
        
                if (emailRows.length > 0) {
                    email = emailRows[0].email;
                }
            } catch (error) {
                log('Could not fetch email: ${error.message}', 'warn');
            }
      
            return {
                firstName: registrationData.first_name,
                lastName: registrationData.last_name,
                phoneNumber: registrationData.phone_number?.replace(/\D/g, '') || null, // Remove non-digits
                occupation: registrationData.occupation,
                gender: registrationData.gender,
                is18OrOlder: registrationData.is_18_or_older === 1,
                baseEmail: email ? email.split('@')[0] : null
            };
        } catch (error) {
            log('Error fetching registration data: ${error.message}', 'error');
            // Return fallback data
            return {
                firstName: 'Alice',
                lastName: 'Brown',
                phoneNumber: '1112223333',
                occupation: 'Doctor',
                gender: 'Female',
                is18OrOlder: true,
                baseEmail: null
            };
        }
    }

    /**
     * Fetch random user data from database
     * @returns {Promise<Object>} User data object
     */
    async fetchRandomUser() {
        try {
            if (!this.connection) {
                return null;
            }
            
            const query = "SELECT * FROM users ORDER BY RAND() LIMIT 1";
            
            const rows = await this.execute(query);
            
            if (rows && rows.length > 0) {
                log('Random user retrieved from database', 'success');
                return rows[0];
            } else {
                log('No users found in database', 'warn');
                return null;
            }
        } catch (error) {
            log('Failed to fetch random user: ${error.message}', 'error');
            
            // Return fallback user data
            return {
                email: 'test@example.com',
                password: 'Test@123',
                firstName: 'Test',
                lastName: 'User'
            };
        }
    }
}

module.exports = DatabaseService;
