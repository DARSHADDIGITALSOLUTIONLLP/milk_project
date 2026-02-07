const Festival = require("../models/Festival");
const moment = require("moment-timezone");
const { Op } = require("sequelize");

/**
 * Get all festivals (with optional filters)
 * @route GET /api/festivals
 * @access SuperAdmin
 */
module.exports.getAllFestivals = async (req, res) => {
    try {
        const { year, is_active, festival_type } = req.query;

        const whereClause = {};
        
        if (year) whereClause.year = year;
        if (is_active !== undefined) whereClause.is_active = is_active === 'true';
        if (festival_type) whereClause.festival_type = festival_type;

        const festivals = await Festival.findAll({
            where: whereClause,
            order: [['date', 'ASC']],
        });

        res.status(200).json({
            message: "Festivals fetched successfully",
            count: festivals.length,
            festivals,
        });
    } catch (error) {
        console.error("Error fetching festivals:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/**
 * Get active festivals for current year
 * @route GET /api/festivals/active
 * @access Public
 */
module.exports.getActiveFestivals = async (req, res) => {
    try {
        const currentYear = moment.tz("Asia/Kolkata").year();

        const festivals = await Festival.findAll({
            where: {
                year: currentYear,
                is_active: true,
            },
            order: [['date', 'ASC']],
        });

        res.status(200).json({
            message: "Active festivals fetched successfully",
            year: currentYear,
            count: festivals.length,
            festivals,
        });
    } catch (error) {
        console.error("Error fetching active festivals:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/**
 * Get festival for a specific date
 * @route GET /api/festivals/date/:date
 * @access Public
 */
module.exports.getFestivalByDate = async (req, res) => {
    try {
        const { date } = req.params; // YYYY-MM-DD format

        const festival = await Festival.findOne({
            where: {
                date: date,
                is_active: true,
            },
        });

        if (!festival) {
            return res.status(404).json({
                message: "No festival found for this date",
                date,
            });
        }

        res.status(200).json({
            message: "Festival found",
            festival,
        });
    } catch (error) {
        console.error("Error fetching festival by date:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/**
 * Create a new festival
 * @route POST /api/festivals
 * @access SuperAdmin
 */
module.exports.createFestival = async (req, res) => {
    try {
        const {
            name,
            date,
            year,
            greeting,
            is_active,
            is_recurring,
            festival_type,
            icon,
        } = req.body;

        // Validate required fields
        if (!name || !date || !year || !greeting) {
            return res.status(400).json({
                message: "Missing required fields: name, date, year, greeting",
            });
        }

        // Check if festival already exists for this date and year
        const existingFestival = await Festival.findOne({
            where: {
                name,
                date,
                year,
            },
        });

        if (existingFestival) {
            return res.status(400).json({
                message: `Festival "${name}" already exists for ${date}, ${year}`,
            });
        }

        const festival = await Festival.create({
            name,
            date,
            year,
            greeting,
            is_active: is_active !== undefined ? is_active : true,
            is_recurring: is_recurring || false,
            festival_type: festival_type || 'cultural',
            icon: icon || null,
        });

        res.status(201).json({
            message: "Festival created successfully",
            festival,
        });
    } catch (error) {
        console.error("Error creating festival:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/**
 * Update a festival
 * @route PUT /api/festivals/:id
 * @access SuperAdmin
 */
module.exports.updateFestival = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            date,
            year,
            greeting,
            is_active,
            is_recurring,
            festival_type,
            icon,
        } = req.body;

        const festival = await Festival.findByPk(id);

        if (!festival) {
            return res.status(404).json({
                message: "Festival not found",
            });
        }

        // Update fields
        if (name !== undefined) festival.name = name;
        if (date !== undefined) festival.date = date;
        if (year !== undefined) festival.year = year;
        if (greeting !== undefined) festival.greeting = greeting;
        if (is_active !== undefined) festival.is_active = is_active;
        if (is_recurring !== undefined) festival.is_recurring = is_recurring;
        if (festival_type !== undefined) festival.festival_type = festival_type;
        if (icon !== undefined) festival.icon = icon;
        
        festival.updated_at = new Date();

        await festival.save();

        res.status(200).json({
            message: "Festival updated successfully",
            festival,
        });
    } catch (error) {
        console.error("Error updating festival:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/**
 * Delete a festival
 * @route DELETE /api/festivals/:id
 * @access SuperAdmin
 */
module.exports.deleteFestival = async (req, res) => {
    try {
        const { id } = req.params;

        const festival = await Festival.findByPk(id);

        if (!festival) {
            return res.status(404).json({
                message: "Festival not found",
            });
        }

        await festival.destroy();

        res.status(200).json({
            message: "Festival deleted successfully",
            deletedFestival: {
                id: festival.id,
                name: festival.name,
                date: festival.date,
                year: festival.year,
            },
        });
    } catch (error) {
        console.error("Error deleting festival:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/**
 * Copy recurring festivals to next year
 * @route POST /api/festivals/copy-to-next-year
 * @access SuperAdmin
 */
module.exports.copyRecurringFestivals = async (req, res) => {
    try {
        const { fromYear, toYear } = req.body;

        if (!fromYear || !toYear) {
            return res.status(400).json({
                message: "Missing required fields: fromYear, toYear",
            });
        }

        // Get all recurring festivals from the source year
        const recurringFestivals = await Festival.findAll({
            where: {
                year: fromYear,
                is_recurring: true,
                is_active: true,
            },
        });

        if (recurringFestivals.length === 0) {
            return res.status(404).json({
                message: `No recurring festivals found for year ${fromYear}`,
            });
        }

        const copiedFestivals = [];

        for (const festival of recurringFestivals) {
            // Check if festival already exists in target year
            const exists = await Festival.findOne({
                where: {
                    name: festival.name,
                    year: toYear,
                },
            });

            if (!exists) {
                // Calculate new date (same month and day, different year)
                const oldDate = moment(festival.date);
                const newDate = moment(`${toYear}-${oldDate.format('MM')}-${oldDate.format('DD')}`);

                const newFestival = await Festival.create({
                    name: festival.name,
                    date: newDate.format('YYYY-MM-DD'),
                    year: toYear,
                    greeting: festival.greeting,
                    is_active: festival.is_active,
                    is_recurring: festival.is_recurring,
                    festival_type: festival.festival_type,
                    icon: festival.icon,
                });

                copiedFestivals.push(newFestival);
            }
        }

        res.status(200).json({
            message: `Copied ${copiedFestivals.length} recurring festivals from ${fromYear} to ${toYear}`,
            copiedCount: copiedFestivals.length,
            skippedCount: recurringFestivals.length - copiedFestivals.length,
            festivals: copiedFestivals,
        });
    } catch (error) {
        console.error("Error copying recurring festivals:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports.getFestivalForToday = async () => {
    try {
        const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

        const festival = await Festival.findOne({
            where: {
                date: today,
                is_active: true,
            },
        });

        return festival;
    } catch (error) {
        console.error("Error fetching today's festival:", error);
        return null;
    }
};
