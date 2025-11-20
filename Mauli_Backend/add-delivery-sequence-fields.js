const sequelize = require("./config/db.js");
const User = require("./models/User.js");

async function addSequenceFields() {
    try {
        console.log("Adding delivery_sequence_morning and delivery_sequence_evening fields...");

        // Add the columns to the users table (MySQL doesn't support IF NOT EXISTS, so we check first)
        try {
            await sequelize.query(`
                ALTER TABLE users 
                ADD COLUMN delivery_sequence_morning INT DEFAULT NULL
            `);
            console.log("Added delivery_sequence_morning column");
        } catch (error) {
            if (error.message.includes("Duplicate column name")) {
                console.log("Column delivery_sequence_morning already exists");
            } else {
                throw error;
            }
        }

        try {
            await sequelize.query(`
                ALTER TABLE users 
                ADD COLUMN delivery_sequence_evening INT DEFAULT NULL
            `);
            console.log("Added delivery_sequence_evening column");
        } catch (error) {
            if (error.message.includes("Duplicate column name")) {
                console.log("Column delivery_sequence_evening already exists");
            } else {
                throw error;
            }
        }

        console.log("Fields added successfully!");

        // Initialize sequence values for existing users
        // For morning shift users
        const morningUsers = await sequelize.query(`
            SELECT id FROM users 
            WHERE (shift = 'morning' OR shift = 'both') 
            AND request = true
            ORDER BY id ASC
        `);

        if (morningUsers[0].length > 0) {
            let sequence = 1;
            for (const user of morningUsers[0]) {
                await sequelize.query(`
                    UPDATE users 
                    SET delivery_sequence_morning = ${sequence} 
                    WHERE id = ${user.id}
                `);
                sequence++;
            }
            console.log(`Initialized morning sequence for ${morningUsers[0].length} users`);
        }

        // For evening shift users
        const eveningUsers = await sequelize.query(`
            SELECT id FROM users 
            WHERE (shift = 'evening' OR shift = 'both') 
            AND request = true
            ORDER BY id ASC
        `);

        if (eveningUsers[0].length > 0) {
            let sequence = 1;
            for (const user of eveningUsers[0]) {
                await sequelize.query(`
                    UPDATE users 
                    SET delivery_sequence_evening = ${sequence} 
                    WHERE id = ${user.id}
                `);
                sequence++;
            }
            console.log(`Initialized evening sequence for ${eveningUsers[0].length} users`);
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error adding sequence fields:", error);
        process.exit(1);
    }
}

addSequenceFields();

