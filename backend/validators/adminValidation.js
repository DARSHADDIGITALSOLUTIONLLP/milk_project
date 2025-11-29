const Joi = require("joi");

const adminRegistrationSchema = Joi.object({
    dairy_name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password_hash: Joi.string().min(6).required(),
    contact: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        "string.pattern.base": "Contact must be between 10  digits."
    }),
    address: Joi.string().min(5).max(255).required(),
    // payment_amount: Joi.number().positive().optional(),  // ✅ Ensures only positive numbers
    // res_date: Joi.date().iso().optional(),  // ✅ Ensures a valid ISO date format
    // periods: Joi.string().valid("monthly", "quarterly", "half-yearly", "yearly").required(),
});

const validateAdminRegistration = (req, res, next) => {
    const { error } = adminRegistrationSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    next(); // ✅ Move to the next middleware
};
const adminALlRegistrationSchema = Joi.object({
    dairy_name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password_hash: Joi.string().min(6).required(),
    contact: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        "string.pattern.base": "Contact must be between 10  digits."
    }),
    address: Joi.string().min(5).max(255).required(),
    payment_amount: Joi.number().positive().optional(),  // ✅ Ensures only positive numbers
    res_date: Joi.date().iso().optional(),  // ✅ Ensures a valid ISO date format
    periods: Joi.string().valid("monthly", "quarterly", "half-yearly", "yearly").required(),
});

const validateAllAdminRegistration = (req, res, next) => {
    const { error } = adminALlRegistrationSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    next(); // ✅ Move to the next middleware
};

module.exports = { validateAdminRegistration, validateAllAdminRegistration };
