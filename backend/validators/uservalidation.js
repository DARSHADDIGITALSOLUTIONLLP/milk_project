const Joi = require("joi");

const userRegistrationSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password_hash: Joi.string().min(6).required(),
    contact: Joi.string().pattern(/^[0-9]{10}$/).required(), // Ensures a 10-digit phone number
    address: Joi.string().min(5).max(255).required(),
    dairy_name: Joi.string().required(),
    milk_type: Joi.string().valid("buffalo", "cow", "pure").required(),
    quantity: Joi.number().positive().required(),
    // start_date: Joi.date().min("now").required(), // Ensures today or future date
    end_date: Joi.date().greater(Joi.ref("start_date")).optional(), // Ensures end_date is after start_date
    shift: Joi.string().valid("morning", "evening", "both").required(),  // ✅ Only accepts a single shift
});

// ✅ Middleware for validation
const validateUserRegistration = (req, res, next) => {
    const { error } = userRegistrationSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    next();
};

module.exports = { validateUserRegistration };
