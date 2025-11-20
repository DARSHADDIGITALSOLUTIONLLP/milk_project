const Joi = require("joi");

// 🔹 Farmer registration schema
const farmerRegistrationSchema = Joi.object({
    full_name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    contact: Joi.string().pattern(/^[0-9]{10}$/).required(),
    address: Joi.string().min(5).max(255).required(),
    password_hash: Joi.string().min(6).required(),
    milk_types: Joi.array().items(
        Joi.string().valid("cow", "buffalo", "pure").required()
    ).min(1).required()  // Ensure at least one milk type is provided
});

// 🔹 Middleware for validation
const validateFarmerRegistration = (req, res, next) => {
    const { error } = farmerRegistrationSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    next();
};

module.exports = { validateFarmerRegistration };
